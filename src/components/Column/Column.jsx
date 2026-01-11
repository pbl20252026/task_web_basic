// components/Column.jsx
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import Card from '../Card/Card'

export function Column({ column }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: column,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    width: '300px',
    backgroundColor: '#f4f5f7',
    padding: '10px',
    margin: '0 10px',
    borderRadius: '5px',
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="font-bold bg-[#ddd] p-2.5 mb-2.5 cursor-grab">
        {column.title}
      </div>
      <SortableContext
        items={column?.cards?.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        {column?.cards?.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </SortableContext>
    </div>
  )
}
