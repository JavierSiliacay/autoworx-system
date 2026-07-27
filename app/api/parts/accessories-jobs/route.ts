import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('accessories_job_logs')
      .select('*')
      .order('date_completed', { ascending: false })

    if (error) {
      console.error('Error fetching accessories job logs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const supabase = await createClient()

    const {
      department = 'ACCESSORIES',
      unit,
      plate_number,
      assured_client = '',
      date_started,
      date_completed,
      scope_of_works,
      dept_head = 'Cabañez',
      assignees = []
    } = body

    if (!unit || !plate_number || !date_started || !date_completed || !scope_of_works) {
      return NextResponse.json({ error: 'Missing required fields (Unit, Plate #, Dates, Scope of Works).' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('accessories_job_logs')
      .insert({
        department,
        unit,
        plate_number,
        assured_client,
        date_started,
        date_completed,
        scope_of_works,
        dept_head,
        assignees,
        created_by: session?.user?.email || 'System'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating accessories job log:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    const supabase = await createClient()

    if (!id) {
      return NextResponse.json({ error: 'Missing record id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('accessories_job_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating accessories job log:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const supabase = await createClient()

    if (!id) {
      return NextResponse.json({ error: 'Missing record id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('accessories_job_logs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting accessories job log:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
