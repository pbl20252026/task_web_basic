// App.js
import { useState } from 'react'
import {
  DndContext,
  closestCorners,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'

import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'

import { MouseSensor, TouchSensor } from './customLibraries/dndKitSensors'

import { Column } from './components/Column/Column'
import Card from './components/Card/Card'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Toaster } from 'sonner'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD',
}

function App() {
  // Fake data
  const [boards, setBoards] = useState([
    {
      id: 'ff6832b2-1702-40ac-b19b-fae2961eae53',
      columnOrderIds: [
        'bb7d1ca9-7562-4b41-8d0e-2e1f09293fd8',
        '8863118f-114b-4e16-951a-ff9421d2c66b',
      ],
      columns: [
        {
          id: 'bb7d1ca9-7562-4b41-8d0e-2e1f09293fd8',
          cardOrderIds: [
            '89df50b4-ca09-4c12-b492-90885809b5c6',
            '12c84d2b-065d-4594-9bce-22778bf6ad49',
          ],
          title: 'Column 1',
          cards: [
            {
              id: '89df50b4-ca09-4c12-b492-90885809b5c6',
              boardId: 'ff6832b2-1702-40ac-b19b-fae2961eae53',
              columnId: 'bb7d1ca9-7562-4b41-8d0e-2e1f09293fd8',
              content: 'Item 1',
            },
            {
              id: '12c84d2b-065d-4594-9bce-22778bf6ad49',
              boardId: 'Board-1',
              columnId: 'bb7d1ca9-7562-4b41-8d0e-2e1f09293fd8',
              content: 'Item 2',
            },
          ],
        },
        {
          id: '8863118f-114b-4e16-951a-ff9421d2c66b',
          cardOrderIds: [
            '2137dfa5-92d0-4ab0-b80f-b10756872b1a',
            '459ab590-add6-453d-bc9a-450688d614d8',
          ],
          title: 'Column 2',
          cards: [
            {
              id: '2137dfa5-92d0-4ab0-b80f-b10756872b1a',
              columnId: '8863118f-114b-4e16-951a-ff9421d2c66b',
              content: 'Item 3',
            },
            {
              id: '459ab590-add6-453d-bc9a-450688d614d8',
              columnId: '8863118f-114b-4e16-951a-ff9421d2c66b',
              content: 'Item 4',
            },
          ],
        },
        {
          id: 'bf099426-9680-47bc-8e18-49af54853204',
          cardOrderIds: ['b1e85ad0-e47e-46c9-9cd3-0fe058ca69cf'],
          title: 'Column 3',
          cards: [
            {
              id: 'b1e85ad0-e47e-46c9-9cd3-0fe058ca69cf',
              columnId: 'bf099426-9680-47bc-8e18-49af54853204',
              content: 'Item 5',
            },
          ],
        },
      ],
    },
  ])

  const [addNewColumn, setAddNewColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')

  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)

  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] =
    useState(null)

  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 250,
      tolerance: 500,
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return

    const newBoard = { ...boards[0] } // Get the current board

    const newColumn = {
      id: crypto.randomUUID(), // Create unique ID for new column
      cardOrderIds: [],
      cards: [{ id: crypto.randomUUID(), content: '', placeholder: true }],
      title: newColumnTitle,
    }

    setBoards([{ ...newBoard, columns: [...newBoard.columns, newColumn] }])

    setNewColumnTitle('')
    setAddNewColumn(false)
  }

  // Handle find column by Card ID
  const findColumnByCardId = (cardId) => {
    return boards[0]?.columns?.find((column) => {
      return column.cards.map((card) => card.id).includes(cardId)
    })
  }

  const handleMoveCardBetweenDifferentColumns = ({
    activeDraggingCardId,
    activeDraggingCardData,
    overColumn,
    activeColumn,
    over,
    active,
  }) => {
    setBoards((prevBoards) => {
      const overCardIndex = overColumn?.cards?.findIndex(
        (card) => card.id === over.id,
      )

      // Calculate new card index
      let newCardIndex

      const isBelowOverItem =
        over &&
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height

      // Calculate the new card index (above or below the over card)
      const modifier = isBelowOverItem ? 1 : 0

      newCardIndex =
        overCardIndex >= 0
          ? overCardIndex + modifier
          : overColumn?.cards?.length + 1

      // Update the columns array
      const nextColumns = [...prevBoards[0]?.columns]

      const nextActiveColumn = nextColumns.find(
        (col) => col.id === activeColumn.id,
      )

      const nextOverColumn = nextColumns.find((col) => col.id === overColumn.id)

      if (nextActiveColumn) {
        // Remove card from active column
        nextActiveColumn.cards = nextActiveColumn.cards.filter((card) => {
          return card.id !== activeDraggingCardId
        })

        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(
          (card) => card.id,
        )

        if (nextActiveColumn.cards.length === 0) {
          nextActiveColumn.cards = [
            { id: crypto.randomUUID(), content: '', placeholder: true },
          ]
        }
      }

      if (nextOverColumn) {
        // Remove card from over column (in case it exists, to avoid duplicates)
        nextOverColumn.cards = nextOverColumn.cards.filter(
          (card) => card.id !== activeDraggingCardId,
        )

        const rebuildActiveDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn.id,
        }

        // Insert card into over column
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(
          newCardIndex,
          0,
          rebuildActiveDraggingCardData,
        )

        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(
          (card) => card.id,
        )

        nextOverColumn.cards = nextOverColumn.cards.filter(
          (card) => !card.placeholder,
        )
      }

      return [{ ...prevBoards[0], columns: nextColumns }]
    })
  }

  // Triggered when drag starts
  const handleDragStart = (event) => {
    setActiveDragItemType(
      event?.active?.data?.current?.columnId
        ? ACTIVE_DRAG_ITEM_TYPE.CARD
        : ACTIVE_DRAG_ITEM_TYPE.COLUMN,
    )

    setActiveDragItemData(event?.active?.data?.current)

    setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id))
  }

  // Triggered when drag over
  const handleDragOver = (event) => {
    // don't do anything when dragging column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return

    const { active, over } = event

    if (!active || !over) return

    // Handle drag & drop card
    const {
      id: activeDraggingCardId,
      data: { current: activeDraggingCardData },
    } = active
    const { id: overCardId } = over

    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId)

    if (!activeColumn || !overColumn) return

    if (overColumn?.id !== activeColumn?.id) {
      handleMoveCardBetweenDifferentColumns({
        activeDraggingCardId,
        activeDraggingCardData,
        overColumn,
        activeColumn,
        over,
        active,
      })
    }
  }

  // Triggered when drag ends
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!active || !over) return

    // Handle drag & drop column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active?.id !== over?.id) {
        const boardToUpdate = [...boards]

        const oldColumnIndex = boardToUpdate[0]?.columns?.findIndex(
          (col) => col.id === active.id,
        )
        const newColumnIndex = boardToUpdate[0]?.columns?.findIndex(
          (col) => col.id === over.id,
        )

        const dndOrderedColumns = arrayMove(
          boardToUpdate[0]?.columns,
          oldColumnIndex,
          newColumnIndex,
        )

        // setOrderedColumns(dndOrderedColumns)
        setBoards([{ ...boards[0], columns: dndOrderedColumns }])
      }
    }

    // Hanlde drag & drop card
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      // Find source and destination columns
      const {
        id: activeDraggingCardId,
        data: { current: activeDraggingCardData },
      } = active
      const { id: overCardId } = over

      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)

      if (!activeColumn || !overColumn) return

      if (overColumn?.id !== oldColumnWhenDraggingCard?.id) {
        // Moving card to different column

        handleMoveCardBetweenDifferentColumns({
          activeDraggingCardId,
          activeDraggingCardData,
          overColumn,
          activeColumn,
          over,
          active,
        })
      } else {
        // Moving card in the same column
        // Get old card index
        const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(
          (card) => card.id === active?.id,
        )

        // Get new card index
        const newCardIndex = activeColumn?.cards?.findIndex(
          (card) => card.id === over?.id,
        )

        // Move card position
        const dndOrderedCards = arrayMove(
          oldColumnWhenDraggingCard?.cards,
          oldCardIndex,
          newCardIndex,
        )

        // Update state
        setBoards((prevBoards) => {
          const newBoards = [...prevBoards]
          const boardToUpdate = newBoards[0]

          const columnToUpdate = boardToUpdate?.columns?.find(
            (column) => column.id === oldColumnWhenDraggingCard.id,
          )

          if (columnToUpdate) {
            columnToUpdate.cards = dndOrderedCards
          }

          return newBoards
        })
      }
    }
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColumnWhenDraggingCard(null)
  }

  // Custom drop animation
  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: 0.5 } },
    }),
  }

  return (
    <div className="overflow-x-auto w-350 h-350">
      <Toaster visibleToasts={5} expand />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        // Algorithm to detect collision
        collisionDetection={closestCorners}
      >
        <div className="p-12 flex items-start h-screen shrink-0">
          <SortableContext
            items={boards[0]?.columns?.map((c) => c.id) || []}
            strategy={horizontalListSortingStrategy}
          >
            {boards[0]?.columns?.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                column={column}
                setBoards={setBoards}
              />
            ))}
          </SortableContext>

          {addNewColumn || (
            <Button onClick={() => setAddNewColumn(true)}>Add Column</Button>
          )}

          {addNewColumn && (
            <div className="flex max-w-sm gap-2">
              <Input
                className="min-w-44 flex-1"
                type="text"
                size="sm"
                placeholder="Title"
                onChange={(e) => setNewColumnTitle(e.target.value)}
              />

              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={handleAddColumn}
              >
                Add
              </Button>

              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => setAddNewColumn(false)}
              >
                ❌
              </Button>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={customDropAnimation}>
          {!activeDragItemType && null}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
            <Column column={activeDragItemData} />
          )}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
            <Card card={activeDragItemData} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
export default App
