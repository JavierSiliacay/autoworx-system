'use client'

import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker'
import { format } from "date-fns"

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days')
  
  // Handle month navigation state
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    props.month || props.defaultMonth || new Date()
  )

  // Sync internal month with props if controlled
  React.useEffect(() => {
    if (props.month) {
      setInternalMonth(props.month)
    }
  }, [props.month])

  const handleMonthChange = (date: Date) => {
    setInternalMonth(date)
    props.onMonthChange?.(date)
  }

  const navMonth = props.month || internalMonth
  const [yearRangeStart, setYearRangeStart] = React.useState(
    Math.floor(navMonth.getFullYear() / 12) * 12
  )

  const defaultClassNames = getDefaultClassNames()

  // Month Selection View
  if (view === 'months') {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
    return (
      <div className={cn("p-3 w-[280px] bg-background border border-border rounded-md shadow-md animate-in fade-in zoom-in-95 duration-200", className)}>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="w-7" /> {/* Spacer */}
          <Button 
            variant="ghost" 
            className="h-8 font-bold text-sm px-3 hover:bg-accent border border-transparent hover:border-border transition-all"
            onClick={() => {
              setYearRangeStart(Math.floor(navMonth.getFullYear() / 12) * 12)
              setView('years')
            }}
          >
            {navMonth.getFullYear()}
            <ChevronDownIcon className="w-3.5 h-3.5 ml-1.5 opacity-50" />
          </Button>
          <div className="w-7" /> {/* Spacer */}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((m, i) => (
            <Button
              key={m}
              variant={i === navMonth.getMonth() ? "default" : "ghost"}
              className={cn(
                "h-10 text-sm font-medium",
                i === navMonth.getMonth() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
              )}
              onClick={() => {
                const newDate = new Date(navMonth)
                newDate.setMonth(i)
                handleMonthChange(newDate)
                setView('days')
              }}
            >
              {m}
            </Button>
          ))}
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-[10px] uppercase tracking-widest font-bold border border-border/50 hover:bg-accent transition-colors" 
          onClick={() => setView('days')}
        >
          Cancel
        </Button>
      </div>
    )
  }

  // Year Selection View
  if (view === 'years') {
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i)
    return (
      <div className={cn("p-3 w-[280px] bg-background border border-border rounded-md shadow-md animate-in fade-in zoom-in-95 duration-200", className)}>
        <div className="flex items-center justify-between mb-4 px-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-accent" 
            onClick={() => setYearRangeStart(prev => prev - 12)}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <div className="text-sm font-bold tracking-tight">
            {yearRangeStart} — {yearRangeStart + 11}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-accent" 
            onClick={() => setYearRangeStart(prev => prev + 12)}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map(y => (
            <Button
              key={y}
              variant={y === navMonth.getFullYear() ? "default" : "ghost"}
              className={cn(
                "h-10 text-sm font-medium",
                y === navMonth.getFullYear() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
              )}
              onClick={() => {
                const newDate = new Date(navMonth)
                newDate.setFullYear(y)
                handleMonthChange(newDate)
                setView('months')
              }}
            >
              {y}
            </Button>
          ))}
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-[10px] uppercase tracking-widest font-bold border border-border/50 hover:bg-accent transition-colors" 
          onClick={() => setView('months')}
        >
          Back to Months
        </Button>
      </div>
    )
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      month={navMonth}
      onMonthChange={handleMonthChange}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'flex gap-4 flex-col md:flex-row relative',
          defaultClassNames.months,
        ),
        month: cn('flex flex-col w-full gap-4', defaultClassNames.month),
        nav: cn(
          'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between pointer-events-none',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none transition-colors hover:bg-accent pointer-events-auto',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none transition-colors hover:bg-accent pointer-events-auto',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          'absolute bg-popover inset-0 opacity-0',
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none',
          defaultClassNames.weekday,
        ),
        week: cn('flex w-full mt-2', defaultClassNames.week),
        week_number_header: cn(
          'select-none w-(--cell-size)',
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          'text-[0.8rem] select-none text-muted-foreground',
          defaultClassNames.week_number,
        ),
        day: cn(
          'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
          defaultClassNames.day,
        ),
        range_start: cn(
          'rounded-l-md bg-accent',
          defaultClassNames.range_start,
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md bg-accent', defaultClassNames.range_end),
        today: cn(
          'bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        MonthCaption: ({ calendarMonth }) => (
          <div className="flex items-center justify-center h-8 relative z-20">
            <button
              type="button"
              className="h-8 font-bold text-sm px-2 hover:bg-accent flex items-center gap-1.5 transition-all group rounded-md cursor-pointer pointer-events-auto bg-transparent border-none text-foreground"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setView('months')
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {format(calendarMonth.date, "MMMM yyyy")}
              <ChevronDownIcon className="w-3.5 h-3.5 opacity-50 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
