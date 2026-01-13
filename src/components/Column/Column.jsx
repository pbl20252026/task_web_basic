import { useState } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'

import { CSS } from '@dnd-kit/utilities'

import Card from '../Card/Card'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Column({ column, setBoards }) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardContent, setNewCardContent] = useState('')

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
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddNewCard = (columnId) => {
    setIsAddingCard(true)

    setBoards((prevBoards) => {
      const newBoards = [...prevBoards]
      const board = newBoards[0] // Assuming there's only one board for simplicity
      const columnToUpdate = board.columns.find(
        (column) => column.id === columnId,
      )
      const newCardToAdd = {
        id: crypto.randomUUID(),
        boardId: board.id,
        columnId: columnId,
        content: newCardContent,
      }

      columnToUpdate.cards.push(newCardToAdd)
      columnToUpdate.cardOrderIds.push(newCardToAdd.id)

      setIsAddingCard(false)
      setNewCardContent('')

      return newBoards
    })
  }

  return (
    <div
      className="flex flex-col w-75 min-w-75 max-h-[calc(100vh-120px)] bg-[#f4f5f7] p-2.5 m-2.5 rounded overflow-y-auto"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="font-bold bg-[#ddd] p-2.5 mb-2.5 cursor-grab">
        {column.title}
      </div>
      <SortableContext
        items={column?.cards?.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div>
          {column?.cards?.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>

      <div className="flex items-center gap-2">
        {isAddingCard && (
          <div className="flex items-center w-full">
            <Input
              className="w-full"
              value={newCardContent}
              placeholder="Enter card title..."
              autoFocus
              onChange={(e) => setNewCardContent(e.target.value)}
            />
            <Button
              className="w-full max-w-24 mt-2.5 mb-1.5"
              onClick={() => handleAddNewCard(column.id)}
            >
              Add Card
            </Button>

            <Button
              className="cursor-pointer"
              size="sm"
              variant="outline"
              onClick={() => setIsAddingCard(false)}
            >
              ❌
            </Button>
          </div>
        )}

        {!isAddingCard && (
          <Button
            className="w-full max-w-24 mt-2.5 mb-1.5"
            onClick={() => setIsAddingCard(true)}
          >
            Add new card
          </Button>
        )}
      </div>
    </div>
  )
}
