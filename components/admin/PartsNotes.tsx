"use client"

import React, { useState, useEffect } from "react"
import { FileText, Plus, Trash2, ChevronLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  updatedAt: number
}

export function PartsNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [draftNote, setDraftNote] = useState<(Note & { isNew?: boolean }) | null>(null)
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const ITEMS_PER_PAGE = 10
  
  const supabase = createClient()

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    setIsLoading(true)
    
    // First, let's check for any pending local storage notes to migrate
    const localSaved = localStorage.getItem("partsAppNotesList")
    if (localSaved) {
      try {
        const localNotes: Note[] = JSON.parse(localSaved)
        if (localNotes.length > 0) {
          // Format them for Supabase insertion
          const notesToInsert = localNotes.map(n => ({
            title: n.title,
            content: n.content,
            created_at: new Date(n.updatedAt).toISOString(),
            updated_at: new Date(n.updatedAt).toISOString()
          }))
          
          await supabase.from('parts_notes').insert(notesToInsert)
          localStorage.removeItem("partsAppNotesList") // Clear local storage after successful migration
          toast({ title: "Local notes successfully migrated to database!" })
        }
      } catch (e) {
        console.error("Failed to migrate local notes", e)
      }
    }
    
    // Now fetch from Supabase
    const { data, error } = await supabase
      .from('parts_notes')
      .select('*')
      .order('updated_at', { ascending: false })
      
    if (error) {
      console.error("Error fetching notes:", error)
      toast({ title: "Failed to load notes", variant: "destructive" })
    } else if (data) {
      // Map database snake_case to frontend camelCase Note interface
      const mappedNotes: Note[] = data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        updatedAt: new Date(n.updated_at).getTime()
      }))
      setNotes(mappedNotes)
    }
    
    setIsLoading(false)
  }

  const createNote = () => {
    setDraftNote({
      id: crypto.randomUUID(),
      title: "",
      content: "",
      updatedAt: Date.now(),
      isNew: true
    })
  }

  const openNote = (note: Note) => {
    setDraftNote({ ...note })
  }

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteNoteId(id)
  }

  const executeDelete = async () => {
    if (!deleteNoteId) return
    setIsDeleting(true)
    
    const { error } = await supabase
      .from('parts_notes')
      .delete()
      .eq('id', deleteNoteId)
      
    setIsDeleting(false)
    if (error) {
      toast({ title: "Failed to delete note", variant: "destructive" })
      return
    }

    const newNotes = notes.filter(n => n.id !== deleteNoteId)
    setNotes(newNotes)
    if (draftNote?.id === deleteNoteId) setDraftNote(null)
    setDeleteNoteId(null)
    toast({ title: "Note deleted" })
  }

  const handleSaveClick = () => {
    if (draftNote?.isNew) {
      setShowSaveConfirm(true)
    } else {
      executeSave()
    }
  }

  const executeSave = async () => {
    if (!draftNote) return
    
    setIsSaving(true)
    let error = null
    let returnedData = null

    if (draftNote.isNew) {
      const { data, error: insertError } = await supabase
        .from('parts_notes')
        .insert({
          title: draftNote.title,
          content: draftNote.content
        })
        .select()
        .single()
        
      error = insertError
      returnedData = data
    } else {
      const { data, error: updateError } = await supabase
        .from('parts_notes')
        .update({
          title: draftNote.title,
          content: draftNote.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftNote.id)
        .select()
        .single()
        
      error = updateError
      returnedData = data
    }
    
    if (error || !returnedData) {
      console.error("Error saving note:", error)
      toast({ title: "Failed to save note", variant: "destructive" })
      setIsSaving(false)
      return
    }

    // Replace or add the new note in the local state
    const savedNote: Note = {
      id: returnedData.id,
      title: returnedData.title,
      content: returnedData.content,
      updatedAt: new Date(returnedData.updated_at).getTime()
    }
    
    let newNotes = [...notes]
    if (draftNote.isNew) {
      newNotes = [savedNote, ...newNotes]
    } else {
      newNotes = newNotes.map(n => n.id === savedNote.id ? savedNote : n)
      newNotes.sort((a, b) => b.updatedAt - a.updatedAt)
    }
    
    setNotes(newNotes)
    setDraftNote(null)
    setShowSaveConfirm(false)
    setIsSaving(false)
    toast({ title: "Note saved successfully", className: "bg-emerald-500 text-white border-emerald-600" })
  }

  const handleBack = () => {
    if (!draftNote) return
    let hasChanges = false
    
    if (draftNote.isNew) {
      if (draftNote.title.trim() !== "" || draftNote.content.trim() !== "") {
        hasChanges = true
      }
    } else {
      const original = notes.find(n => n.id === draftNote.id)
      if (original && (original.title !== draftNote.title || original.content !== draftNote.content)) {
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      setShowUnsavedConfirm(true)
    } else {
      setDraftNote(null)
    }
  }

  const confirmBack = () => {
    setShowUnsavedConfirm(false)
    setDraftNote(null)
  }

  const updateDraft = (updates: Partial<Note>) => {
    if (!draftNote) return
    setDraftNote({ ...draftNote, ...updates })
  }

  if (draftNote) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden relative">
        <div className="flex items-center gap-2 p-3 border-b border-slate-100 bg-slate-50">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 text-slate-500 hover:text-slate-700 hover:bg-slate-200">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Input 
            autoFocus={!draftNote.title}
            value={draftNote.title} 
            onChange={e => updateDraft({ title: e.target.value })}
            className="border-none font-bold text-lg shadow-none focus-visible:ring-0 px-1 bg-transparent text-slate-900 placeholder:text-slate-400"
            placeholder="Note Title..."
          />
          <Button 
            size="sm" 
            disabled={isSaving}
            onClick={handleSaveClick} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 ml-2 gap-1.5 h-8 font-bold shadow-sm"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 
            Save
          </Button>
        </div>
        <Textarea
          value={draftNote.content}
          onChange={e => updateDraft({ content: e.target.value })}
          placeholder="Start typing your note here..."
          className="flex-1 resize-none border-none rounded-none focus-visible:ring-0 p-5 text-slate-700 leading-relaxed bg-amber-50/30 text-sm"
        />

        {showSaveConfirm && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <h4 className="font-black text-lg text-slate-900 mb-2">Save Note</h4>
              <p className="text-slate-600 text-sm mb-6">Are you sure you want to save this new note?</p>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setShowSaveConfirm(false)} className="font-bold border-slate-200 text-slate-600">
                  Cancel
                </Button>
                <Button disabled={isSaving} autoFocus onClick={executeSave} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {showUnsavedConfirm && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <h4 className="font-black text-lg text-slate-900 mb-2">Unsaved Changes</h4>
              <p className="text-slate-600 text-sm mb-6">Are you sure you want to back? This note might be unsaved.</p>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setShowUnsavedConfirm(false)} className="font-bold border-slate-200 text-slate-600">
                  Cancel
                </Button>
                <Button autoFocus onClick={confirmBack} className="font-bold bg-red-600 hover:bg-red-700 text-white">
                  Discard Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const totalPages = Math.ceil(notes.length / ITEMS_PER_PAGE)
  const paginatedNotes = notes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-lg overflow-hidden relative">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          My Notes
        </h3>
        <Button onClick={createNote} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-2 font-bold shadow-sm">
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm font-medium">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-medium">No notes yet.</p>
            <p className="text-xs mt-1">Create one to get started!</p>
          </div>
        ) : (
          paginatedNotes.map(note => (
            <div 
              key={note.id} 
              onClick={() => openNote(note)}
              className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{note.title || "Untitled Note"}</h4>
                  <p className="text-xs text-slate-500 truncate mt-1.5">
                    {note.content || <span className="italic text-slate-400">Empty note</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                    {new Date(note.updatedAt).toLocaleDateString()} • {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => confirmDelete(note.id, e)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
        
        {totalPages > 1 && (
          <div className="pt-4 mt-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50 text-slate-400" : "cursor-pointer text-slate-700 hover:text-red-600 hover:bg-red-50"}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm font-medium text-slate-500 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50 text-slate-400" : "cursor-pointer text-slate-700 hover:text-red-600 hover:bg-red-50"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {deleteNoteId && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <h4 className="font-black text-lg text-slate-900 mb-2">Delete Note</h4>
              <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete this note? This action cannot be undone.</p>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={(e) => { e.stopPropagation(); setDeleteNoteId(null) }} className="font-bold border-slate-200 text-slate-600">
                  Cancel
                </Button>
                <Button disabled={isDeleting} autoFocus onClick={(e) => { e.stopPropagation(); executeDelete() }} className="font-bold bg-red-600 hover:bg-red-700 text-white">
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
