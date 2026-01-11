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
    // transform: CSS.Translate.toString(transform),
    // transition,
    // padding: '10px',
    // margin: '5px 0',
    // backgroundColor: isDragging ? '#e3f2fd' : '#fff',
    // border: '1px solid #ddd',
    // borderRadius: '4px',
    // cursor: 'grab',
    // opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="p-2.5 my-1 bg-white border border-gray-200 rounded shadow-sm"
      style={style}
    >
      {card.content}
    </div>
  )
}

export default Card
