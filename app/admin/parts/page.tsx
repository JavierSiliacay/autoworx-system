"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Package, Plus, Search, Trash2, RefreshCw,
  ArrowUpCircle, ArrowDownCircle, LayoutDashboard,
  TrendingUp, TrendingDown, Boxes,
  CheckCircle2, Settings2, Check, Save,
  Folder, ChevronDown, ChevronRight, LogOut, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

/* ─── Types ────────────────────────────────────────────────────────────────── */
type TransactionType = "STOCK_IN" | "STOCK_OUT" | "EDIT" | null

const KIND_OPTIONS = ["SURPLUS", "GENUINE", "REPLACEMENT"] as const
const COND_OPTIONS = ["GOOD", "BAD"] as const

interface Transaction {
  id: string
  created_at: string
  transaction_type: TransactionType
  item_name: string
  kind: string | null
  condition: string | null
  customer_name: string | null
  unit_model: string | null
  plate_number: string | null
  quantity: number
  notes: string | null
  performed_by: string | null
  purchaser: string | null
  stock_id?: string | null
  status?: "STOCKED_IN" | "RELEASED" | "STOCK_OUT" | null
  parts_in_date?: string | null
  parts_out_date?: string | null
}

interface Totals {
  totalQty: number
  stockIn: number
  stockOut: number
  leftInStock: number
}

interface InventoryItem {
  id: string
  name: string
  brand: string
  category: string
  quantity: number
}

// A single row in the Stock IN batch queue
interface BatchItem {
  tempId: string
  item_name: string
  kind: string
  condition: string
  quantity: number
  notes: string
  stock_id: string
  purchaser: string
  customer_name: string
  unit_model: string
  plate_number: string
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function PartsLedgerPage() {
  const router = useRouter()
  const { status, data: session } = useSession()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totals, setTotals] = useState<Totals>({ totalQty: 0, stockIn: 0, stockOut: 0, leftInStock: 0 })
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | TransactionType>("ALL")

  // Modal & Group state
  const [modalType, setModalType] = useState<TransactionType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [viewDeletedHistory, setViewDeletedHistory] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ── STOCK IN: batch queue ──────────────────────────────────────────────────
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [batchItemName, setBatchItemName] = useState("")
  const [batchKind, setBatchKind] = useState<string>("GENUINE")
  const [batchKindCustom, setBatchKindCustom] = useState("")
  const [batchCondition, setBatchCondition] = useState<string>("GOOD")
  const [batchConditionCustom, setBatchConditionCustom] = useState("")
  const [batchQty, setBatchQty] = useState("1")
  const [batchNotes, setBatchNotes] = useState("")
  const [batchPurchaser, setBatchPurchaser] = useState("")
  const [batchCustomer, setBatchCustomer] = useState("")
  const [batchUnitModel, setBatchUnitModel] = useState("")
  const [batchPlate, setBatchPlate] = useState("")
  const [batchStockId, setBatchStockId] = useState("")
  const [batchInvSearch, setBatchInvSearch] = useState("")
  const itemNameRef = useRef<HTMLInputElement>(null)

  // ── STOCK OUT: single entry ────────────────────────────────────────────────
  const [formItemName, setFormItemName] = useState("")
  const [formKind, setFormKind] = useState<string>("GENUINE")
  const [formKindCustom, setFormKindCustom] = useState("")
  const [formCondition, setFormCondition] = useState<string>("GOOD")
  const [formConditionCustom, setFormConditionCustom] = useState("")
  const [formCustomer, setFormCustomer] = useState("")
  const [formUnitModel, setFormUnitModel] = useState("")
  const [formPlate, setFormPlate] = useState("")
  const [formQty, setFormQty] = useState("1")
  const [formNotes, setFormNotes] = useState("")
  const [formStockId, setFormStockId] = useState("")
  const [selectedItemStock, setSelectedItemStock] = useState<number | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [invSearch, setInvSearch] = useState("")

  // ── STOCK OUT: Owner Checklist ───────────────────────────────────────────────
  const [selectedOutOwner, setSelectedOutOwner] = useState<string>("")
  const [outReleaseQtys, setOutReleaseQtys] = useState<Record<string, number>>({})
  const [releaseNotes, setReleaseNotes] = useState("")

  /* ── Auth guard ── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin")
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/admin")
  }, [status, session, router])

  /* ── Fetch data ── */
  const fetchLedger = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/parts/ledger")
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setTotals(data.totals || {})
      }
    } catch { /* silent */ } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory")
      if (res.ok) setInventory(await res.json())
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchLedger()
      fetchInventory()
    }
  }, [status, fetchLedger, fetchInventory])

  /* ── Modal open/close ── */
  const openModal = (type: TransactionType) => {
    setModalType(type)
    // Reset batch
    setBatchItems([]); setBatchItemName(""); setBatchKind("GENUINE"); setBatchKindCustom("")
    setBatchCondition("GOOD"); setBatchConditionCustom(""); setBatchQty("1")
    setBatchNotes(""); setBatchStockId(""); setBatchInvSearch("")
    // Reset single
    setFormItemName(""); setFormKind("GENUINE"); setFormKindCustom("")
    setFormCondition("GOOD")
    setSelectedItemStock(null)
    setFormConditionCustom("")
    setFormCustomer(""); setFormUnitModel("")
    setFormPlate(""); setFormQty("1")
    setFormNotes(""); setFormStockId(""); setInvSearch("")
    setEditingTransaction(null)
    setSelectedOutOwner("")
    setOutReleaseQtys({})
    setReleaseNotes("")
  }
  const closeModal = () => setModalType(null)

  /* ── Batch IN: add to queue on Enter ── */
  const addToBatch = () => {
    if (!batchItemName.trim()) { toast({ title: "Item name is required", variant: "destructive" }); return }
    const resolvedKind = batchKind === "CUSTOM" ? batchKindCustom.trim() || "CUSTOM" : batchKind
    const resolvedCond = batchCondition === "CUSTOM" ? batchConditionCustom.trim() || "CUSTOM" : batchCondition
    setBatchItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      item_name: batchItemName.trim(),
      kind: resolvedKind,
      condition: resolvedCond,
      quantity: parseInt(batchQty) || 1,
      notes: batchNotes,
      purchaser: batchPurchaser.trim(),
      customer_name: batchCustomer.trim(),
      unit_model: batchUnitModel.trim(),
      plate_number: batchPlate.trim().toUpperCase(),
      stock_id: batchStockId,
    }])
    // Clear PART fields only, KEEPS customer/purchaser for multi-item job entries
    setBatchItemName(""); setBatchQty("1"); setBatchNotes(""); setBatchStockId(""); setBatchInvSearch("")
    setTimeout(() => itemNameRef.current?.focus(), 50)
  }

  const removeFromBatch = (tempId: string) =>
    setBatchItems(prev => prev.filter(i => i.tempId !== tempId))

  const updateBatchItem = (tempId: string, updates: Partial<BatchItem>) => {
    setBatchItems(prev => prev.map(item => item.tempId === tempId ? { ...item, ...updates } : item))
  }

  const handleBatchInvPick = (item: InventoryItem) => {
    setBatchItemName(item.name)
    setBatchStockId(item.id)
    setBatchInvSearch("")
  }

  /* ── STOCK IN: submit all batch items ── */
  const handleBatchSubmit = async () => {
    if (batchItems.length === 0) { toast({ title: "Add at least one item to the queue", variant: "destructive" }); return }
    setIsSubmitting(true)
    try {
      const results = await Promise.all(batchItems.map(async (item) => {
        const res = await fetch("/api/parts/ledger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_type: "STOCK_IN",
            item_name: item.item_name,
            kind: item.kind || null,
            condition: item.condition || null,
            customer_name: item.customer_name || null,
            unit_model: item.unit_model || null,
            plate_number: item.plate_number || null,
            quantity: item.quantity,
            notes: item.notes || null,
            purchaser: item.purchaser || null,
            stock_id: item.stock_id || null,
          })
        })
        return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }
      }))

      const failed = results.filter(r => !r.ok)
      if (failed.length === 0) {
        toast({ title: `✓ ${batchItems.length} item${batchItems.length > 1 ? "s" : ""} stocked in successfully!` })
        closeModal(); fetchLedger(); fetchInventory()
      } else {
        const firstErr = failed[0].data?.error || "Unknown API error"
        toast({
          title: "Save Failed",
          description: `${failed.length} item(s) could not be saved. Error: ${firstErr}`,
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({ title: "Network error", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Owner-based STOCK OUT submit ── */
  const handleSubmitOwnerStockOut = async (e: React.FormEvent) => {
    e.preventDefault()

    // Calculate which items user wants to release
    const itemsToRelease = ownerStock
      .filter(s => s.owner === selectedOutOwner && (outReleaseQtys[s.key] > 0))

    if (itemsToRelease.length === 0) {
      toast({ title: "Select at least one item to release.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const results = await Promise.all(itemsToRelease.map(async (item) => {
        const qty = outReleaseQtys[item.key]
        const res = await fetch("/api/parts/ledger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_type: "STOCK_OUT",
            item_name: item.item_name,
            kind: item.kind || null,
            condition: item.condition || null,
            customer_name: item.owner || null,
            unit_model: item.unit_model || null,
            plate_number: item.plate || null,
            quantity: qty,
            notes: releaseNotes || "Released via batch checklist",
            purchaser: item.purchaser || null,
            stock_id: item.stock_id || null,
            parts_in_date: item.created_at || null,
          })
        })
        return { ok: res.ok }
      }))

      if (results.some(r => !r.ok)) {
        toast({ title: "Some items failed to release", variant: "destructive" })
      } else {
        toast({ title: "Stock OUT recorded successfully", className: "bg-emerald-500 text-white" })
        closeModal()
        fetchLedger()
        fetchInventory()
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (tx: Transaction) => {
    setEditingTransaction(tx)
    setFormItemName(tx.item_name)
    setFormKind(KIND_OPTIONS.includes(tx.kind as any) ? (tx.kind as any) : (tx.kind ? "CUSTOM" : "GENUINE"))
    setFormKindCustom(KIND_OPTIONS.includes(tx.kind as any) ? "" : (tx.kind || ""))
    setFormCondition(COND_OPTIONS.includes(tx.condition as any) ? (tx.condition as any) : (tx.condition ? "CUSTOM" : "GOOD"))
    setFormConditionCustom(COND_OPTIONS.includes(tx.condition as any) ? "" : (tx.condition || ""))
    setFormCustomer(tx.customer_name || "")
    setFormUnitModel(tx.unit_model || "")
    setFormPlate(tx.plate_number || "")
    setFormQty(String(tx.quantity))
    setFormNotes(tx.notes || "")
    setBatchPurchaser(tx.purchaser || "") // reuse purchaser state for simplicity
    setModalType("EDIT")
  }

  const openStockOutForOwner = (owner: string | null) => {
    openModal("STOCK_OUT")
    if (owner) {
      setTimeout(() => setSelectedOutOwner(owner), 50)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction) return
    setIsSubmitting(true)
    try {
      const resolvedKind = formKind === "CUSTOM" ? formKindCustom.trim() : formKind
      const resolvedCond = formCondition === "CUSTOM" ? formConditionCustom.trim() : formCondition

      const res = await fetch("/api/parts/ledger", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTransaction.id,
          item_name: formItemName,
          kind: resolvedKind,
          condition: resolvedCond,
          customer_name: formCustomer,
          unit_model: formUnitModel,
          plate_number: formPlate,
          quantity: formQty,
          notes: formNotes,
          purchaser: batchPurchaser,
          parts_in_date: editingTransaction.created_at,
        })
      })
      if (res.ok) {
        toast({ title: "Entry updated successfully" })
        closeModal(); fetchLedger(); fetchInventory()
      } else {
        const err = await res.json()
        toast({ title: "Update failed", description: err.error, variant: "destructive" })
      }
    } catch { toast({ title: "Network error", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  /* ── Soft Delete ── */
  const handleSoftDelete = async (id: string) => {
    if (!confirm("Move this entry to history? (It can be restored later)")) return
    const res = await fetch(`/api/parts/ledger`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "soft_delete", ids: [id] }) 
    })
    if (res.ok) { toast({ title: "Entry moved to history" }); fetchLedger() }
    else toast({ title: "Failed to delete", variant: "destructive" })
  }

  /* ── Restore ── */
  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/parts/ledger`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", ids: [id] }) 
    })
    if (res.ok) { toast({ title: "Entry restored" }); fetchLedger() }
    else toast({ title: "Failed to restore", variant: "destructive" })
  }

  /* ── Permanent Delete ── */
  const handlePermanentDelete = async (id: string) => {
    if (!confirm("WARNING: Are you sure you want to PERMANENTLY delete this entry? This cannot be undone.")) return
    const res = await fetch(`/api/parts/ledger?id=${id}`, { method: "DELETE" })
    if (res.ok) { toast({ title: "Entry permanently removed" }); fetchLedger() }
    else toast({ title: "Failed to delete", variant: "destructive" })
  }

  /* ── Bulk Revert ── */
  const handleBulkRevert = async () => {
    if (!confirm(`Are you sure you want to revert ${selectedIds.size} releases? The items will be returned to stock.`)) return
    setIsSubmitting(true)
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(id => fetch(`/api/parts/ledger?id=${id}&revert=true`, { method: "DELETE" }))
      )
      const failed = results.filter(r => !r.ok).length
      if (failed > 0) toast({ title: `Failed to revert ${failed} items`, variant: "destructive" })
      if (failed < selectedIds.size) toast({ title: `Reverted ${selectedIds.size - failed} releases successfully`, className: "bg-emerald-500 text-white" })

      setSelectedIds(new Set())
      fetchLedger()
      fetchInventory()
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Bulk Soft Delete ── */
  const handleBulkSoftDelete = async () => {
    if (!confirm(`Are you sure you want to move ${selectedIds.size} transactions to history?`)) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/parts/ledger`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "soft_delete", ids: Array.from(selectedIds) })
      })
      if (res.ok) {
        toast({ title: `Moved ${selectedIds.size} entries to history`, className: "bg-emerald-500 text-white" })
        setSelectedIds(new Set())
        fetchLedger()
      } else {
        toast({ title: "Failed to move items to history", variant: "destructive" })
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Bulk Restore ── */
  const handleBulkRestore = async () => {
    if (!confirm(`Are you sure you want to restore ${selectedIds.size} transactions?`)) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/parts/ledger`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", ids: Array.from(selectedIds) })
      })
      if (res.ok) {
        toast({ title: `Restored ${selectedIds.size} entries`, className: "bg-emerald-500 text-white" })
        setSelectedIds(new Set())
        fetchLedger()
      } else {
        toast({ title: "Failed to restore items", variant: "destructive" })
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Bulk Permanent Delete ── */
  const handleBulkPermanentDelete = async () => {
    if (!confirm(`WARNING: Are you sure you want to PERMANENTLY remove ${selectedIds.size} transactions? This cannot be undone.`)) return
    setIsSubmitting(true)
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(id => fetch(`/api/parts/ledger?id=${id}`, { method: "DELETE" }))
      )
      const failed = results.filter(r => !r.ok).length
      if (failed > 0) toast({ title: `Failed to permanently delete ${failed} items`, variant: "destructive" })
      if (failed < selectedIds.size) toast({ title: `Permanently deleted ${selectedIds.size - failed} entries`, className: "bg-emerald-500 text-white" })

      setSelectedIds(new Set())
      fetchLedger()
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Computed unreleased parts per owner
  const allOwnerStock = useMemo(() => {
    const stockMap: Record<string, any> = {}

    transactions.forEach(tx => {
      if (tx.status?.startsWith("DELETED_")) return
      if (!tx.customer_name) return
      const key = `${tx.customer_name}_${tx.plate_number || ''}_${tx.item_name}_${tx.kind || ''}_${tx.condition || ''}`

      if (!stockMap[key]) {
        stockMap[key] = {
          key, owner: tx.customer_name, plate: tx.plate_number, item_name: tx.item_name,
          kind: tx.kind, condition: tx.condition, unit_model: tx.unit_model, stock_id: tx.stock_id,
          totalIn: 0, totalOut: 0, purchaser: tx.purchaser,
        }
      }

      if (tx.transaction_type === "STOCK_IN") {
        stockMap[key].totalIn += tx.quantity
        if (!stockMap[key].created_at) stockMap[key].created_at = tx.created_at
      }
      if (tx.transaction_type === "STOCK_OUT") stockMap[key].totalOut += tx.quantity
    })

    return Object.values(stockMap).map(item => ({ ...item, available: item.totalIn - item.totalOut }))
  }, [transactions])

  const normalizeString = (str: string | null | undefined) => {
    if (!str) return ""
    return str.toLowerCase().replace(/[\s\-\.\/\,]/g, "")
  }

  /* ── Filtered rows ── */
  const filtered = useMemo(() => transactions.filter(tx => {
    const isDeleted = tx.status?.startsWith("DELETED_")
    if (viewDeletedHistory && !isDeleted) return false
    if (!viewDeletedHistory && isDeleted) return false

    if (!viewDeletedHistory) {
      const matchType = filterType === "ALL" || tx.transaction_type === filterType
      if (!matchType) return false
      // Keep Stock-Out records visible (they define the release), but hide the original redundant Stock-In
      if (tx.transaction_type === "STOCK_IN" && tx.status === "RELEASED") return false
    }

    if (searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
      const isRecordMatch = tokens.every(token => {
        const normToken = normalizeString(token)
        return [
          tx.item_name,
          tx.customer_name,
          tx.unit_model,
          tx.plate_number,
          tx.notes,
          tx.kind,
          tx.condition,
          tx.purchaser
        ].some(field => normalizeString(field).includes(normToken))
      })
      if (!isRecordMatch) return false
    }

    return true
  }), [transactions, filterType, searchQuery, viewDeletedHistory])

  const groupedTransactions = useMemo(() => {
    const groups: any[] = []
    let currentGroup: Transaction[] = []

    for (let i = 0; i < filtered.length; i++) {
      const tx = filtered[i]
      if (tx.customer_name) {
        if (currentGroup.length === 0) {
          currentGroup = [tx]
        } else {
          const prevTx = currentGroup[currentGroup.length - 1]
          const timeDiff = Math.abs(new Date(prevTx.created_at).getTime() - new Date(tx.created_at).getTime())

          if (
            tx.transaction_type === prevTx.transaction_type &&
            tx.customer_name === prevTx.customer_name &&
            tx.plate_number === prevTx.plate_number &&
            timeDiff < 120000 // 2 min batch window
          ) {
            currentGroup.push(tx)
          } else {
            if (currentGroup.length > 1) {
              groups.push({ isGroup: true, id: `group-${currentGroup[0].transaction_type}-${currentGroup[0].id}`, items: [...currentGroup] })
            } else if (currentGroup.length === 1) {
              groups.push({ isGroup: false, transaction: currentGroup[0] })
            }
            currentGroup = [tx]
          }
        }
      } else {
        if (currentGroup.length > 1) {
          groups.push({ isGroup: true, id: `group-${currentGroup[0].id}`, items: [...currentGroup] })
        } else if (currentGroup.length === 1) {
          groups.push({ isGroup: false, transaction: currentGroup[0] })
        }
        currentGroup = []
        groups.push({ isGroup: false, transaction: tx })
      }
    }

    if (currentGroup.length > 1) {
      groups.push({ isGroup: true, id: `group-${currentGroup[0].id}`, items: currentGroup })
    } else if (currentGroup.length === 1) {
      groups.push({ isGroup: false, transaction: currentGroup[0] })
    }

    return groups
  }, [filtered])

  const displayTotals = useMemo(() => {
    const res = transactions.reduce((acc, tx) => {
      if (tx.status?.startsWith("DELETED_")) return acc
      // Stock-In records that are released are essentially deleted/hidden
      // Stock-Out records (Status: RELEASED) are the active history we want to count
      if (tx.transaction_type === "STOCK_IN" && tx.status !== "RELEASED") {
        acc.stockIn += tx.quantity
      }
      if (tx.transaction_type === "STOCK_OUT") {
        acc.stockOut += tx.quantity
      }
      return acc
    }, { stockIn: 0, stockOut: 0 })
    return { 
      totalQty: res.stockIn - res.stockOut,
      stockIn: res.stockIn,
      stockOut: res.stockOut,
      leftInStock: res.stockIn - res.stockOut 
    }
  }, [transactions])

  const ownerStock = useMemo(() => allOwnerStock.filter(item => item.available > 0), [allOwnerStock])

  const availableOwnersForOut = useMemo(() => {
    return Array.from(new Set(ownerStock.map(s => s.owner)))
  }, [ownerStock])

  const filteredInv = inventory.filter(i =>
    !invSearch || i.name.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.brand?.toLowerCase().includes(invSearch.toLowerCase())
  )

  const renderTxRow = (tx: Transaction, isSubRow = false) => {
    const isExpRow = !!expandedRows[tx.id]
    const kindColor = tx.kind === "GENUINE" ? "bg-blue-50 text-blue-700 border-blue-200"
      : tx.kind === "SURPLUS" ? "bg-amber-50 text-amber-700 border-amber-200"
      : tx.kind === "REPLACEMENT" ? "bg-violet-50 text-violet-700 border-violet-200"
      : "bg-slate-100 text-slate-600 border-slate-200"

    return (
      <React.Fragment key={tx.id}>
        <tr
          onClick={() => setExpandedRows(prev => ({ ...prev, [tx.id]: !prev[tx.id] }))}
          className={`cursor-pointer transition-colors ${tx.transaction_type === "STOCK_IN" ? "border-l-4 border-l-emerald-400" : "border-l-4 border-l-red-400"} ${isSubRow ? "bg-blue-50/60 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)] hover:bg-blue-100/50" : "hover:bg-slate-50"} ${isExpRow ? "bg-slate-50" : ""}`}
        >
          {/* Checkbox */}
          <td className="px-3 py-3 w-10" onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={selectedIds.has(tx.id)}
              onChange={(e) => { const s = new Set(selectedIds); e.target.checked ? s.add(tx.id) : s.delete(tx.id); setSelectedIds(s) }}
              className="rounded border-slate-300 w-4 h-4 text-red-600 focus:ring-red-600 cursor-pointer" />
          </td>

          {/* Type + Status stacked */}
          <td className="px-3 py-3">
            <div className="flex flex-col gap-1">
              <Badge className={`text-[9px] font-black uppercase w-fit ${tx.transaction_type === "STOCK_IN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {tx.transaction_type === "STOCK_IN" ? "↑ IN" : "↓ OUT"}
              </Badge>
              {tx.transaction_type === "STOCK_IN" && (
                tx.status === "RELEASED"
                  ? <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Released</span>
                  : <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide animate-pulse">Available</span>
              )}
              {tx.transaction_type === "STOCK_OUT" && (
                <span className="text-[8px] font-bold text-red-500 uppercase tracking-wide">Released</span>
              )}
            </div>
          </td>

          {/* Item name */}
          <td className="px-3 py-3 max-w-[180px]">
            <div className={`flex items-center gap-2 ${isSubRow ? "ml-4" : ""}`}>
              {isSubRow && <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 flex-shrink-0" />}
              <span className="font-bold text-slate-900 text-sm truncate" title={tx.item_name}>{tx.item_name}</span>
            </div>
            {/* Kind + Condition inline under item name */}
            <div className="flex gap-1 mt-1 flex-wrap">
              {tx.kind && <span className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border ${kindColor}`}>{tx.kind}</span>}
              {tx.condition && <span className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border ${tx.condition === "GOOD" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>{tx.condition}</span>}
            </div>
          </td>

          {/* Owner + Vehicle stacked */}
          <td className="px-3 py-3 max-w-[160px]">
            {isSubRow ? <span className="text-slate-300 text-xs">↳ same</span> : (
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-slate-800 truncate" title={tx.customer_name ?? ""}>{tx.customer_name || <span className="text-slate-300">—</span>}</div>
                <div className="text-xs text-slate-500 truncate" title={tx.unit_model ?? ""}>{tx.unit_model || <span className="text-slate-300">—</span>}</div>
              </div>
            )}
          </td>

          {/* Plate */}
          <td className="px-3 py-3">
            {isSubRow ? <span className="text-slate-300 text-xs">↳</span> : (
              <span className="text-xs font-mono font-black text-slate-900 tracking-widest uppercase bg-slate-100 px-2 py-1 rounded whitespace-nowrap">{tx.plate_number || "—"}</span>
            )}
          </td>

          {/* Qty */}
          <td className="px-3 py-3 text-center">
            <span className={`text-sm font-black px-2 py-1 rounded-full ${tx.transaction_type === "STOCK_IN" ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
              {tx.transaction_type === "STOCK_IN" ? `+${tx.quantity}` : `-${tx.quantity}`}
            </span>
          </td>

          {/* Expand indicator */}
          <td className="px-2 py-3 text-center">
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 mx-auto transition-transform duration-200 ${isExpRow ? "rotate-180" : ""}`} />
          </td>

          {/* Actions */}
          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-1">
              {viewDeletedHistory ? (
                <>
                  <button onClick={() => handleRestore(tx.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handlePermanentDelete(tx.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors" title="Permanently Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => openStockOutForOwner(tx.customer_name)} className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100" title="Release / Stock-Out"><LogOut className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit"><Settings2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleSoftDelete(tx.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Move to History"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          </td>
        </tr>

        {/* ── Expandable Detail Row ── */}
        {isExpRow && (
          <tr className={`${tx.transaction_type === "STOCK_IN" ? "border-l-4 border-l-emerald-200" : "border-l-4 border-l-red-200"} bg-slate-50/80`}>
            <td colSpan={8} className="px-6 pb-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Date In</p>
                  <p className="font-semibold text-slate-700">{tx.parts_in_date ? formatDate(tx.parts_in_date) : tx.transaction_type === "STOCK_IN" ? formatDate(tx.created_at) : "N/A"}</p>
                </div>
                {tx.transaction_type === "STOCK_OUT" && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Date Released</p>
                    <p className="font-semibold text-red-600">{formatDate(tx.created_at)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Purchaser</p>
                  <p className="font-semibold text-slate-700">{tx.purchaser || "—"}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Notes / Remarks</p>
                  <p className="text-slate-600 leading-relaxed">{tx.notes || <span className="text-slate-300">—</span>}</p>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    )
  }





  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-semibold text-sm animate-pulse">Loading Parts Ledger...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800 shadow-lg">
        <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-18 h-14 select-none">
                <img src="/autoworxlogo.png" alt="Autoworx logo" className="w-18 h-18 object-contain drop-shadow-md" />
              </div>
              <div>
                <div className="text-white font-black text-lg tracking-tight leading-none">AUTOWORX</div>
                <div className="text-red-400 font-bold text-[10px] uppercase tracking-widest">Parts & Accessories Inventory</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs hidden md:block">
              Logged in as <span className="text-white font-bold">{session?.user?.name}</span>
            </span>
            <Link href="/admin/dashboard">
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
            <Button size="sm" onClick={fetchLedger} variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 lg:px-8 py-6 space-y-6">

        {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={<Boxes className="w-5 h-5" />} label="Total Quantity" value={displayTotals.totalQty} color="blue" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Stock In" value={displayTotals.stockIn} color="emerald" />
          <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Total Stock Out" value={displayTotals.stockOut} color="red" />
          <StatCard icon={<Package className="w-5 h-5" />} label="Left in Stock" value={displayTotals.leftInStock} color={displayTotals.leftInStock < 10 ? "amber" : "slate"} />
          <StatCard icon={<ArrowUpCircle className="w-5 h-5" />} label="STOCK IN Entries" value={transactions.filter(t => t.transaction_type === "STOCK_IN" && t.status !== "RELEASED").length} color="emerald" isCount />
        </div>

        {/* ── TOOLBAR ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter tabs */}
            {(["ALL", "STOCK_IN", "STOCK_OUT"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${filterType === f
                    ? f === "STOCK_IN"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : f === "STOCK_OUT"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
              >
                {f === "ALL" ? "All Transactions" : f === "STOCK_IN" ? "↑ Stock In" : "↓ Stock Out"}
              </button>
            ))}

            <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>

            <button
              onClick={() => setViewDeletedHistory(!viewDeletedHistory)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${viewDeletedHistory
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
            >
              {viewDeletedHistory ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
              {viewDeletedHistory ? "Back to Active" : "Delete History"}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search item, owner, plate..."
                className="pl-10 h-10 bg-white border-slate-200 text-slate-900 text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Primary Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                {!viewDeletedHistory && Array.from(selectedIds).every(id => {
                  const tx = transactions.find(t => t.id === id)
                  return tx && tx.transaction_type === "STOCK_OUT"
                }) && (
                  <Button onClick={handleBulkRevert} className="h-10 gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 border border-blue-200 shadow-sm font-bold">
                    <RotateCcw className="w-4 h-4" /> Undo Release
                  </Button>
                )}
                {viewDeletedHistory ? (
                  <>
                    <Button onClick={handleBulkRestore} className="h-10 gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 border border-emerald-200 shadow-sm font-bold">
                      <RotateCcw className="w-4 h-4" /> Restore {selectedIds.size}
                    </Button>
                    <Button onClick={handleBulkPermanentDelete} className="h-10 gap-2 bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-sm font-bold">
                      <Trash2 className="w-4 h-4" /> Delete {selectedIds.size}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleBulkSoftDelete} className="h-10 gap-2 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 border border-red-200 shadow-sm font-bold">
                    <Trash2 className="w-4 h-4" /> Delete {selectedIds.size}
                  </Button>
                )}
              </div>
            )}
            <Button onClick={() => openModal("STOCK_IN")} className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm">
              <ArrowUpCircle className="w-4 h-4" /> STOCK IN
            </Button>
            <Button onClick={() => openModal("STOCK_OUT")} className="h-10 gap-2 bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm">
              <ArrowDownCircle className="w-4 h-4" /> STOCK OUT
            </Button>
          </div>
        </div>

        {/* ── LEDGER TABLE ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="bg-[#0f172a] px-6 py-3 flex items-center justify-between">
            <h2 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-red-400" /> Parts & Accessories Transaction
            </h2>
            <span className="text-slate-400 text-xs">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox"
                      onChange={(e) => { if (e.target.checked) setSelectedIds(new Set(filtered.map(tx => tx.id))); else setSelectedIds(new Set()) }}
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      className="rounded border-slate-300 w-4 h-4 text-red-600 focus:ring-red-600 cursor-pointer" />
                  </th>
                  {["TYPE / STATUS", "ITEM NAME", "CLIENT / VEHICLE", "PLATE NO.", "QTY", "", "ACTIONS"].map(h => (
                    <th key={h} className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      <p className="font-semibold text-sm">No transactions recorded yet.</p>
                      <p className="text-xs mt-1">Click STOCK IN or STOCK OUT to add an entry.</p>
                    </td>
                  </tr>
                ) : groupedTransactions.map(group => {
                  if (!group.isGroup) {
                    const tx = group.transaction
                    return renderTxRow(tx, false)
                  } else {
                    const isExpanded = !!expandedGroups[group.id]
                    const firstTx = group.items[0]
                    const totalQty = group.items.reduce((acc: any, item: any) => acc + parseInt(item.quantity || "0"), 0)
                    return (
                      <React.Fragment key={group.id}>
                        <tr onClick={() => toggleGroup(group.id)} className="hover:bg-blue-50/50 transition-colors border-l-4 border-l-blue-500 bg-slate-50 cursor-pointer">
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <input type="checkbox"
                              checked={group.items.length > 0 && group.items.every((tx: any) => selectedIds.has(tx.id))}
                              ref={el => { if (el) { const all = group.items.every((t: any) => selectedIds.has(t.id)); const some = group.items.some((t: any) => selectedIds.has(t.id)); el.indeterminate = some && !all } }}
                              onChange={(e) => { const s = new Set(selectedIds); if (e.target.checked) group.items.forEach((t: any) => s.add(t.id)); else group.items.forEach((t: any) => s.delete(t.id)); setSelectedIds(s) }}
                              className="rounded border-slate-300 w-4 h-4 text-red-600 focus:ring-red-600 cursor-pointer" />
                          </td>
                          <td colSpan={5} className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                              <Folder className="w-4 h-4 text-blue-600" fill="currentColor" fillOpacity={0.2} />
                              <span className="font-black text-[10px] text-blue-800 uppercase tracking-widest">{firstTx.transaction_type === "STOCK_IN" ? "BATCH STOCK-IN" : "BATCH RELEASE"} ({group.items.length} ITEMS)</span>
                              <span className="text-[10px] text-slate-500 font-semibold">{firstTx.customer_name}</span>
                              {firstTx.plate_number && <span className="text-[9px] font-mono font-black bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 uppercase">{firstTx.plate_number}</span>}
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${firstTx.transaction_type === "STOCK_IN" ? "text-blue-700 bg-blue-100" : "text-red-700 bg-red-100"}`}>{firstTx.transaction_type === "STOCK_IN" ? `+${totalQty}` : `-${totalQty}`}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 mx-auto transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          </td>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openStockOutForOwner(firstTx.customer_name)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Release Batch Items">
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && group.items.map((tx: any) => renderTxRow(tx, true))}
                      </React.Fragment>
                    )
                  }
                })}
              </tbody>
            </table>
          </div>


        </div>
      </main>

      {/* ── STOCK IN MODAL: Master-Detail entry ─────────────────────────────────── */}
      <Dialog open={modalType === "STOCK_IN"} onOpenChange={open => { if (!open) closeModal() }}>
        <DialogContent className="max-w-5xl bg-white border-slate-200 shadow-2xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-[#0f172a] text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <div>Stock IN</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Multi-item Owner Entry</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ── 1. JOB / OWNER INFO (SHARED HEADER) ────────────────────── */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">1. Job / Owner Information</h3>
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-[2] min-w-[200px] space-y-1 flex flex-col justify-end">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Owner Name</Label>
                  <Input value={batchCustomer} onChange={e => setBatchCustomer(e.target.value)} placeholder="Juan Dela Cruz" className="h-10 text-slate-900 font-bold bg-white w-full" />
                </div>
                <div className="flex-[1.5] min-w-[150px] space-y-1 flex flex-col justify-end">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Unit Model</Label>
                  <Input value={batchUnitModel} onChange={e => setBatchUnitModel(e.target.value)} placeholder="Toyota Vios" className="h-10 text-slate-900 font-bold bg-white w-full" />
                </div>
                <div className="flex-[1] min-w-[120px] space-y-1 flex flex-col justify-end">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Plate Number</Label>
                  <Input value={batchPlate} onChange={e => setBatchPlate(e.target.value)} placeholder="KAB 2316" className="h-10 text-slate-900 font-mono font-black uppercase bg-white tracking-widest px-3 w-full" />
                </div>
                <div className="flex-[1.5] min-w-[150px] space-y-1 flex flex-col justify-end">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Purchaser</Label>
                  <Input value={batchPurchaser} onChange={e => setBatchPurchaser(e.target.value)} placeholder="Name of purchaser" className="h-10 text-slate-900 font-bold bg-white w-full" />
                </div>
              </div>
            </div>

            {/* ── 2. PART ENTRY ───────────────────────────────────────────── */}
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
                  2. Add Parts to Job
                  <span className="normal-case font-bold text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
                    Click <kbd className="bg-white px-1 rounded shadow-sm border border-emerald-200">Enter</kbd> to add to list
                  </span>
                </h3>
              </div>

              <div className="space-y-4">

                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-[3] min-w-[200px] space-y-1 flex flex-col justify-end">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Part Name *</Label>
                    <Input ref={itemNameRef} value={batchItemName} onChange={e => setBatchItemName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addToBatch() } }}
                      placeholder="e.g. Oil Filter" className="h-10 font-bold bg-white text-slate-900 w-full" />
                  </div>
                  <div className="flex-[1] min-w-[80px] space-y-1 flex flex-col justify-end">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Quantity</Label>
                    <Input type="number" min="1" value={batchQty} onChange={e => setBatchQty(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addToBatch() } }}
                      className="h-10 font-mono font-black text-slate-900 bg-white text-center text-lg w-full" />
                  </div>
                  <div className="flex-[2] min-w-[120px] space-y-1 flex flex-col justify-end">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Kind</Label>
                    <Select value={batchKind} onValueChange={setBatchKind}>
                      <SelectTrigger className="h-10 border-slate-200 text-slate-900 bg-white font-medium w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KIND_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        <SelectItem value="CUSTOM">CUSTOM...</SelectItem>
                      </SelectContent>
                    </Select>
                    {batchKind === "CUSTOM" && (
                      <Input 
                        value={batchKindCustom} 
                        onChange={e => setBatchKindCustom(e.target.value)}
                        placeholder="Type custom kind..."
                        className="h-8 text-xs mt-1 text-slate-900 bg-white border-emerald-200"
                      />
                    )}
                  </div>
                  <div className="flex-[3] min-w-[150px] space-y-1 flex flex-col justify-end">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate block mb-1">Remarks</Label>
                    <Input value={batchNotes} onChange={e => setBatchNotes(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addToBatch() } }}
                      placeholder="Optional notes" className="h-10 text-slate-900 bg-white w-full" />
                  </div>
                  <div className="flex-none w-[46px] space-y-1 flex flex-col justify-end">
                    <Label className="text-[10px] font-black uppercase tracking-widest invisible block mb-1">Add</Label>
                    <Button onClick={addToBatch} className="h-10 w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex-shrink-0 px-0 flex items-center justify-center">
                      <Plus className="w-5 h-5 font-bold" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. QUEUED ITEMS ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-3 bg-slate-900 flex items-center justify-between">
                <span className="text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Items in this Job ({batchItems.length})
                </span>
                {batchItems.length > 0 && (
                  <span className="text-slate-400 text-[10px] font-black uppercase">Ready to Commit</span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto w-full">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                    <tr className="border-b border-slate-200">
                      {["Part Name", "Kind", "Cond.", "Qty", "Remarks", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-slate-400">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-xs font-black uppercase tracking-widest">Step 2: Add parts above</p>
                        </td>
                      </tr>
                    ) : (
                     batchItems.map(item => (
                      <tr key={item.tempId} className="hover:bg-emerald-50/10 transition-colors group">
                        <td className="px-3 py-2">
                          <Input
                            value={item.item_name}
                            onChange={e => updateBatchItem(item.tempId, { item_name: e.target.value })}
                            className="h-8 text-[11px] font-black uppercase bg-transparent border-transparent text-slate-900 hover:border-slate-200 focus:bg-white focus:border-emerald-300 transition-all px-2 shadow-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {!KIND_OPTIONS.includes(item.kind as any) || item.kind === "CUSTOM" ? (
                            <div className="relative w-full min-w-[120px]">
                              <Input
                                autoFocus
                                value={item.kind === "CUSTOM" ? "" : item.kind}
                                onChange={e => updateBatchItem(item.tempId, { kind: e.target.value })}
                                placeholder="Kind..."
                                className="h-8 text-[10px] font-black uppercase bg-white border-emerald-400 text-slate-900 px-2 pr-7 shadow-sm focus:ring-1 focus:ring-emerald-500 w-full"
                              />
                              <button 
                                onClick={() => updateBatchItem(item.tempId, { kind: "GENUINE" })}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-md hover:bg-red-50"
                                title="Reset to standard options"
                              >
                                <Plus className="w-3.5 h-3.5 rotate-45" />
                              </button>
                            </div>
                          ) : (
                            <Select
                              value={item.kind}
                              onValueChange={val => updateBatchItem(item.tempId, { kind: val })}
                            >
                              <SelectTrigger className="h-8 text-[10px] font-black uppercase bg-transparent border-transparent text-slate-900 hover:border-slate-200 focus:bg-white px-2 shadow-none w-full min-w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {KIND_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                <SelectItem value="CUSTOM">CUSTOM...</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={item.condition}
                            onValueChange={val => updateBatchItem(item.tempId, { condition: val })}
                          >
                            <SelectTrigger className="h-8 text-[10px] font-black uppercase bg-transparent border-transparent text-slate-900 hover:border-slate-200 focus:bg-white px-2 shadow-none w-fit min-w-[80px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COND_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateBatchItem(item.tempId, { quantity: parseInt(e.target.value) || 1 })}
                            className="h-8 w-16 text-center font-mono font-black text-xs bg-transparent border-transparent text-slate-900 hover:border-slate-200 focus:bg-white focus:border-emerald-300 transition-all px-1 shadow-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={item.notes || ""}
                            onChange={e => updateBatchItem(item.tempId, { notes: e.target.value })}
                            placeholder="Add remarks..."
                            className="h-8 text-[11px] font-medium bg-transparent border-transparent text-slate-900 hover:border-slate-200 focus:bg-white focus:border-emerald-300 transition-all px-2 shadow-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => removeFromBatch(item.tempId)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Remove from list"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={closeModal} className="h-11 px-8 rounded-xl font-bold border-slate-300">Cancel</Button>
            <Button
              onClick={handleBatchSubmit}
              disabled={isSubmitting || batchItems.length === 0}
              className="h-11 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-200 flex items-center gap-3"
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isSubmitting ? "Finalizing Transaction..." : `Commit Transaction (${batchItems.length} Part${batchItems.length !== 1 ? "s" : ""})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STOCK OUT MODAL: Owner Checklist ─────────────────────────────────────── */}
      <Dialog open={modalType === "STOCK_OUT"} onOpenChange={open => { if (!open) closeModal() }}>
        <DialogContent className="max-w-4xl p-0 bg-slate-50 border-slate-200 shadow-2xl flex flex-col h-[90vh] overflow-hidden">
          <DialogHeader className="p-6 bg-white border-b border-slate-200 shrink-0">
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <ArrowDownCircle className="w-6 h-6 text-red-500" />
              <div>
                <div>Stock OUT (Job Release)</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Select previously stocked-in items by Owner</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">1. Select Job / Owner</Label>
              <Select value={selectedOutOwner} onValueChange={setSelectedOutOwner}>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-bold text-sm">
                  <SelectValue placeholder="Select an Owner..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOwnersForOut.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">No unreleased stock available.</div>
                  ) : (
                    availableOwnersForOut.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedOutOwner && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">2. Select Parts to Release</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const parts = ownerStock.filter(s => s.owner === selectedOutOwner)
                      const allSelected = parts.every(item => outReleaseQtys[item.key] > 0)
                      setOutReleaseQtys(prev => {
                        const next = { ...prev }
                        parts.forEach(item => {
                          next[item.key] = allSelected ? 0 : item.available
                        })
                        return next
                      })
                    }}
                    className="text-[10px] font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Toggle All
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {ownerStock.filter(s => s.owner === selectedOutOwner).map(item => {
                    const isSelected = (outReleaseQtys[item.key] || 0) > 0
                    return (
                      <div key={item.key} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isSelected ? "bg-red-50/50" : "hover:bg-slate-50"}`}>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {item.item_name}
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {item.kind || "GENUINE"} • {item.condition || "GOOD"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 font-mono">
                            {item.plate ? `Vehicle: ${item.plate}` : "No Plate Info"}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Available</div>
                            <div className="font-black text-emerald-600">{item.available} <span className="text-xs font-bold text-slate-400">PCS</span></div>
                          </div>
                          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setOutReleaseQtys(prev => ({
                                  ...prev,
                                  [item.key]: isSelected ? 0 : item.available
                                }))
                              }}
                              className={`h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${isSelected
                                  ? "bg-red-100 hover:bg-red-200 text-red-700 border-red-200 shadow-sm"
                                  : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                                }`}
                            >
                              {isSelected ? (
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Selected</span>
                              ) : "Select"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Global Release Notes */}
            <div className="p-6 pt-0 border-t border-slate-100 mt-auto">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 px-1 truncate">Release Notes / Internal Remarks (Optional)</Label>
              <Input 
                value={releaseNotes} 
                onChange={e => setReleaseNotes(e.target.value)}
                placeholder="e.g. Parts released for pickup, completed job..."
                className="h-11 bg-white border-slate-200 text-slate-900 focus:ring-red-500 shadow-sm"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={closeModal} className="h-11 px-8 rounded-xl font-bold border-slate-300">Cancel</Button>
            <Button
              onClick={handleSubmitOwnerStockOut}
              disabled={isSubmitting || !selectedOutOwner || Object.values(outReleaseQtys).every(v => !v || v === 0)}
              className="h-11 px-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg flex items-center gap-3"
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowDownCircle className="w-5 h-5" />}
              {isSubmitting ? "Finalizing Release..." : "Confirm Release"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT MODAL ───────────────────────────────────────────────────────────── */}
      <Dialog open={modalType === "EDIT"} onOpenChange={open => { if (!open) closeModal() }}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3 text-blue-700">
              <Settings2 className="w-6 h-6" /> Edit Transaction Record
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium">Correcting record from {editingTransaction && formatDate(editingTransaction.created_at)}</p>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700">Item Name</Label>
                <Input value={formItemName} onChange={e => setFormItemName(e.target.value)} className="h-10 font-semibold text-slate-900" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Kind</Label>
                <Select value={formKind} onValueChange={setFormKind}>
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    <SelectItem value="CUSTOM">CUSTOM...</SelectItem>
                  </SelectContent>
                </Select>
                {formKind === "CUSTOM" && (
                  <Input value={formKindCustom} onChange={e => setFormKindCustom(e.target.value)}
                    placeholder="Describe kind..." className="h-8 text-xs mt-1 text-slate-900 bg-white" />
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Condition</Label>
                <Select value={formCondition} onValueChange={setFormCondition}>
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COND_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    <SelectItem value="CUSTOM">CUSTOM...</SelectItem>
                  </SelectContent>
                </Select>
                {formCondition === "CUSTOM" && (
                  <Input value={formConditionCustom} onChange={e => setFormConditionCustom(e.target.value)}
                    placeholder="Describe condition..." className="h-8 text-xs mt-1 text-slate-900 bg-white" />
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Purchaser</Label>
                <Input value={batchPurchaser} onChange={e => setBatchPurchaser(e.target.value)} placeholder="Who bought?" className="h-10 text-slate-900 bg-white" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Quantity</Label>
                <Input type="number" value={formQty} onChange={e => setFormQty(e.target.value)} className="h-10 text-slate-900 font-mono" />
              </div>

              {editingTransaction?.transaction_type === "STOCK_OUT" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Owner Name</Label>
                    <Input value={formCustomer} onChange={e => setFormCustomer(e.target.value)} className="h-10 text-slate-900 bg-white" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Unit Model</Label>
                    <Input value={formUnitModel} onChange={e => setFormUnitModel(e.target.value)} className="h-10 text-slate-900 bg-white" />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Plate Number</Label>
                    <Input value={formPlate} onChange={e => setFormPlate(e.target.value)} className="h-10 font-mono text-slate-900 bg-white uppercase" />
                  </div>
                </>
              )}

              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700">Notes / Remarks</Label>
                <Input value={formNotes} onChange={e => setFormNotes(e.target.value)} className="h-10 text-slate-900 bg-white" />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── StatCard ─────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, isCount }: {
  icon: React.ReactNode; label: string; value: number;
  color: "blue" | "emerald" | "red" | "amber" | "violet" | "slate";
  isCount?: boolean;
}) {
  const colors = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", val: "text-blue-900" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", val: "text-emerald-900" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600", val: "text-red-900" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", val: "text-amber-900" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", val: "text-violet-900" },
    slate: { bg: "bg-slate-50", border: "border-slate-200", icon: "text-slate-600", val: "text-slate-900" },
  }
  const c = colors[color]
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-4 flex flex-col gap-2 shadow-sm`}>
      <div className={`${c.icon} w-fit`}>{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`font-black text-xl ${c.val} font-mono leading-none mt-0.5`}>
          {value}
        </p>
      </div>
    </div>
  )
}
