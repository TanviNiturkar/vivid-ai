import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { LayoutSlides, Slide } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useSlideStore } from '@/store/useSlideStore'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useDrag, useDrop } from 'react-dnd'
import { MasterRecursiveComponent } from './MasterRecursiveComponent'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { EllipsisVertical, Trash } from 'lucide-react'
import { updateSlides } from '@/actions/project'

/* DropZone — no change needed, already styled */

interface DropZoneProps {
  index: number
  onDrop: (
    item: {
      type: string
      layoutType: string
      component: LayoutSlides
      index?: number
    },
    dropIndex: number
  ) => void
  isEditable: boolean
}

export const DropZone: React.FC<DropZoneProps> = ({ index, onDrop, isEditable }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ['SLIDE', 'layout'],
    drop: (item: any) => onDrop(item, index),
    canDrop: () => isEditable,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  })

  if (!isEditable) return null

  return (
    <div
      ref={dropRef as unknown as React.RefObject<HTMLDivElement>}
      className={cn(
        'h-4 my-2 rounded-md transition-all duration-300',
        'transform-gpu perspective-1000',
        isOver && canDrop ? 'border-green-500 bg-green-100 scale-105 shadow-md' : 'border-gray-300',
        canDrop ? 'hover:scale-105 hover:shadow-lg' : ''
      )}
    >
      {isOver && canDrop && (
        <div className='h-full flex items-center justify-center text-green-600 text-sm'>Drop here</div>
      )}
    </div>
  )
}

/* DraggableSlide — updated only layout styling for responsiveness */

interface DraggableSlideProps {
  slide: Slide
  index: number
  moveSlide: (dragIndex: number, hoverIndex: number) => void
  handleDelete: (id: string) => void
  isEditable: boolean
}

export const DraggableSlide: React.FC<DraggableSlideProps> = ({
  slide,
  index,
  moveSlide,
  handleDelete,
  isEditable,
}) => {
  const ref = useRef(null)
  const { currentSlide, setCurrentSlide, currentTheme, updateContentItem } = useSlideStore()

  const [{ isDragging }, drag] = useDrag({
    type: 'SLIDE',
    item: { index, type: 'SLIDE' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditable,
  })

  const [_, drop] = useDrop({
    accept: ['SLIDE', 'LAYOUT'],
    hover(item: { index: number; type: string }) {
      if (!ref.current || !isEditable) return
      const dragIndex = item.index
      const hoverIndex = index
      if (item.type === 'SLIDE' && dragIndex !== hoverIndex) {
        moveSlide(dragIndex, hoverIndex)
        item.index = hoverIndex
      }
    },
  })

  drag(drop(ref))

  const handleContentChange = (contentId: string, newContent: string | string[] | string[][]) => {
    if (isEditable) {
      updateContentItem(slide.id, contentId, newContent)
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'w-full bg-white rounded-xl shadow-lg p-4 sm:p-6 min-h-[400px] max-h-[800px] mb-8',
        'flex flex-col relative transition-transform duration-300 transform-gpu hover:scale-[1.01] hover:shadow-2xl',
        index === currentSlide ? 'ring-2 ring-blue-500 ring-offset-2' : '',
        slide.className,
        isDragging ? 'opacity-50 rotate-[1deg] scale-95' : 'opacity-100'
      )}
      style={{ backgroundImage: currentTheme.gradientBackground }}
      onClick={() => setCurrentSlide(index)}
    >
      <div className='h-full w-full flex-grow overflow-hidden'>
        <MasterRecursiveComponent
          content={slide.content}
          isPreview={false}
          slideId={slide.id}
          isEditable={isEditable}
          onContentChange={handleContentChange}
        />
      </div>

      {isEditable && (
        <Popover>
          <PopoverTrigger asChild className='absolute top-2 left-2'>
            <Button size='sm' variant='outline'>
              <EllipsisVertical className='w-5 h-5' />
              <span className='sr-only'>Slide options</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-fit p-0'>
            <div className='flex space-x-2'>
              <Button variant='ghost' onClick={() => handleDelete(slide.id)}>
                <Trash className='w-5 h-5 text-red-500' />
                <span className='sr-only'>Delete slide</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

/* Main Editor component */

type Props = {
  isEditable: boolean
}

const Editor = ({ isEditable }: Props) => {
  const {
    getOrderedSlides,
    reorderSlides,
    slides,
    project,
    removeSlide,
    addSlideAtIndex,
    currentSlide,
  } = useSlideStore()

  const orderedSlides = getOrderedSlides()
  const [loading, setLoading] = useState(true)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const moveSlide = (dragIndex: number, hoverIndex: number) => {
    if (isEditable) reorderSlides(dragIndex, hoverIndex)
  }

  const handleDrop = (item: any, dropIndex: number) => {
    if (!isEditable) return
    if (item.type === 'layout') {
      addSlideAtIndex(
        {
          ...item.component,
          id: uuidv4(),
          slideOrder: dropIndex,
        },
        dropIndex
      )
    } else if (item.type === 'SLIDE' && item.index !== undefined) {
      moveSlide(item.index, dropIndex)
    }
  }

  useEffect(() => {
    if (slideRefs.current[currentSlide]) {
      slideRefs.current[currentSlide]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentSlide])

  useEffect(() => {
    if (typeof window !== 'undefined') setLoading(false)
  }, [])

  const saveSlides = useCallback(() => {
    if (isEditable && project) {
      ;(async () => {
        await updateSlides(project.id, JSON.parse(JSON.stringify(slides)))
      })()
    }
  }, [isEditable, project, slides])

  useEffect(() => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    if (isEditable) {
      autoSaveTimeoutRef.current = setTimeout(() => saveSlides(), 2000)
    }
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    }
  }, [slides, isEditable, project])

  const handleDelete = (id: string) => {
    if (isEditable) removeSlide(id)
  }

  return (
    <div className='flex-1 flex flex-col h-full w-full max-w-3xl mx-auto px-4 sm:px-6 mb-20'>
      {loading ? (
        <div className='w-full flex flex-col space-y-6'>
          <Skeleton className='h-52 w-full' />
          <Skeleton className='h-52 w-full' />
          <Skeleton className='h-52 w-full' />
        </div>
      ) : (
        <ScrollArea className='flex-1 mt-8 overflow-x-hidden'>
          <div className='px-0 sm:px-2 pb-6 space-y-6'>
            {isEditable && <DropZone index={0} onDrop={handleDrop} isEditable={isEditable} />}
            {orderedSlides.map((slide, index) => (
              <React.Fragment key={slide.id || index}>
                <DraggableSlide
                  slide={slide}
                  index={index}
                  moveSlide={moveSlide}
                  handleDelete={handleDelete}
                  isEditable={isEditable}
                />
                {isEditable && <DropZone index={index + 1} onDrop={handleDrop} isEditable={isEditable} />}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export default Editor
