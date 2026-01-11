// App.js
import { useState } from 'react'
import {
  DndContext,
  closestCorners,
  PointerSensor,
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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD',
}

function App() {
  // Data mẫu
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
              boardId: 'ff6832b2-1702-40ac-b19b-fae2961eae53',
              columnId: 'bb7d1ca9-7562-4b41-8d0e-2e1f09293fd8',
              id: '89df50b4-ca09-4c12-b492-90885809b5c6',
              content: 'Item 1',
            },
            {
              boardId: 'Board-1',
              columnId: 'bb7d1ca9-7562-4b41-8d0e-2e1f09293fd8',
              id: '12c84d2b-065d-4594-9bce-22778bf6ad49',
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
              columnId: '8863118f-114b-4e16-951a-ff9421d2c66b',
              id: '2137dfa5-92d0-4ab0-b80f-b10756872b1a',
              content: 'Item 1',
            },
            {
              columnId: '8863118f-114b-4e16-951a-ff9421d2c66b',
              id: '459ab590-add6-453d-bc9a-450688d614d8',
              content: 'Item 2',
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

  const [orderedColumns, setOrderedColumns] = useState(boards[0].columns)

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
    // Logic to add a new column

    const newBoard = { ...boards[0] } // Lấy board hiện tại
    // console.log('🚀 ~ handleAddColumn ~ newBoard:', newBoard)

    const newColumn = {
      id: `col-${newBoard?.columns.length + 1}`, // Tạo ID mới cho column
      cardOrderIds: [],
      cards: [],
      title: newColumnTitle,
    }

    setBoards([{ ...newBoard, columns: [...orderedColumns, newColumn] }])
    setOrderedColumns([...orderedColumns, newColumn])

    setNewColumnTitle('')
    setAddNewColumn(false)
  }

  // Triggered when drag starts
  const handleDragStart = (event) => {
    console.log('🚀 ~ handleDragStart ~ event:', event)
    setActiveDragItemType(
      event?.active?.data?.current?.columnId
        ? ACTIVE_DRAG_ITEM_TYPE.CARD
        : ACTIVE_DRAG_ITEM_TYPE.COLUMN,
    )

    setActiveDragItemData(event?.active?.data?.current)
  }

  // Triggered when drag over
  const handleDragOver = (event) => {
    // console.log('🚀 ~ handleDragOver ~ event:', event)

    // don't do anything when dragging column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return
  }

  // Triggered when drag ends
  const handleDragEnd = (event) => {
    console.log('🚀 ~ handleDragEnd ~ event:', event)
    const { active, over } = event
    if (!active || !over) return

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active?.id !== over?.id) {
        const oldColumnIndex = orderedColumns?.findIndex(
          (col) => col.id === active.id,
        )
        const newColumnIndex = orderedColumns?.findIndex(
          (col) => col.id === over.id,
        )

        const dndOrderedColumns = arrayMove(
          orderedColumns,
          oldColumnIndex,
          newColumnIndex,
        )

        console.log(
          '🚀 ~ handleDragEnd ~ dndOrderedColumns:',
          dndOrderedColumns,
        )

        setOrderedColumns(dndOrderedColumns)
        setBoards([{ ...boards[0], columns: dndOrderedColumns }])
      }
    }
  }

  // Handle drag column

  // Custom drop animation
  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: 0.5 } },
    }),
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="p-12 flex overflow-x-auto">
        <SortableContext
          items={boards[0]?.columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {boards[0]?.columns?.map((column) => (
            <Column key={column.id} id={column.id} column={column} />
          ))}
        </SortableContext>

        {addNewColumn || (
          <Button onClick={() => setAddNewColumn(true)}>Add Column</Button>
        )}

        {addNewColumn && (
          <div className="flex max-w-sm gap-2">
            <Input
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
        {/* {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
          <Card card={activeDragItemData} />
        )} */}
      </DragOverlay>
    </DndContext>
  )
}
n
export default App
