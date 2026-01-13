import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function Card({ card }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: card })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1 && card.placeholder ? 0 : 1,
  }

  return (
    <div
      className="p-2.5 my-1 bg-white border border-gray-200 rounded shadow-sm cursor-pointer"
      style={style}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {card.content}
    </div>
  )
}

export default Card
