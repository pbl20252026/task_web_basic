import { useRef } from 'react'

const lerp = (start, end, t) => {
  return start + (end - start) * t
}

export function useVirtualCursor() {
  // Luu trạng thái trước để so sánh
  const prevState = useRef({ isPinching: false })
  const prevClickTime = useRef(0)

  // Ref tới con trỏ ảo
  const cursorRef = useRef(null)

  // Lưu toạ độ trước để làm mượt chuyển động
  const prevPosition = useRef({ x: 0, y: 0 })

  const clickState = useRef({
    startTime: 0,
    startX: 0,
    startY: 0,
  })

  const updateCursor = ({ x, y, state }) => {
    // console.log('🚀 ~ updateCursor ~ state:', state)
    // 1. Quy đổi toạ độ từ (0-1) sang Pixel
    const screenX = x * window.innerWidth
    const screenY = y * window.innerHeight

    const smoothFactor = 0.15

    const smoothX = lerp(prevPosition.current.x, screenX, smoothFactor)
    const smoothY = lerp(prevPosition.current.y, screenY, smoothFactor)

    prevPosition.current = { x: smoothX, y: smoothY }

    if (cursorRef && cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${smoothX}px, ${smoothY}px, 0)`
    }

    // 2. Lấy trạng thái cũ
    const wasPinching = prevState.current.isPinching

    // Cấu hình chung cho sự kiện
    const eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: smoothX,
      clientY: smoothY,
      pointerId: 1, // Luôn giả lập là pointer số 1
      pointerType: 'mouse',
      isPrimary: true,
      button: 0, // 0 = Chuột trái
      buttons: state.isPinching ? 1 : 0, // 1 = Đang nhấn, 0 = Không nhấn
    }

    // 3. Logic bắn sự kiện (State Machine)
    // -------------- Xử lý khi mouse down xảy ra --------------
    if (state.isPinching && !wasPinching) {
      // Chỉ dispatch sự kiện mouse down
      clickState.current = {
        startTime: Date.now(),
        startX: smoothX,
        startY: smoothY,
      }

      const TriggerMouseDownCallback = (element, x, y) => {
        // Xử lỷ cả 2 trường hợp mouse event và pointer event
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true, // Để sự kiện nổi lên cho React bắt
          cancelable: true, // Cho phép dùng preventDefault
          view: window, // Cửa sổ hiện tại
          clientX: x, // Tọa độ X của ngón tay/MediaPipe
          clientY: y, // Tọa độ Y
          button: 0, // 0 = Chuột trái
          buttons: 1, // 1 = Đang nhấn
        })

        const pointerEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true, // Cho phép dùng preventDefault
          view: window,
          clientX: x, // Tọa độ X của ngón tay/MediaPipe
          clientY: y, // Tọa độ Y
          pointerId: 1, // Luôn giả lập là pointer số 1
          pointerType: 'mouse',
          isPrimary: true, // Luôn là con trỏ chính
          button: 0, // 0 = Chuột trái
          buttons: 1, // 1 = Đang nhấn
        })

        // Trình duyệt cần cả 2 loại sự kiện để nhận biết
        // Trigger cả 2 sự kiện
        element.dispatchEvent(mouseEvent)
        element.dispatchEvent(pointerEvent)
      }

      // Tìm phần tử ngay dưới con trỏ
      const target = document.elementFromPoint(screenX, screenY)
      if (target) {
        // triggerClickCallback(target, screenX, screenY)
        TriggerMouseDownCallback(target, screenX, screenY)
      }
    }

    // -------------- Xử lý khi mouse up xảy ra --------------
    if (!state.isPinching && wasPinching) {
      // Tính toán thời gian kể từ lúc mouse down đến khi mouse up
      const clickDuration = Date.now() - clickState.current.startTime || 0

      // Tính toán khoảng cách di chuyển từ lúc mouse down đến khi mouse up
      const moveDistance =
        Math.hypot(
          smoothX - clickState.current.startX,
          smoothY - clickState.current.startY,
        ) || 0

      const target = document.elementFromPoint(screenX, screenY)

      if (target) {
        // Kiểm tra trường hợp double click
        if (
          prevClickTime.current > 0 &&
          Date.now() - prevClickTime.current < 500
        ) {
          // Dispatch sự kiện double click
          target.dispatchEvent(
            new MouseEvent('dblclick', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: smoothX,
              clientY: smoothY,
              button: 0, // 0 = Chuột trái
              buttons: 0, // 0 = Không nhấn
            }),
          )

          // Reset trạng thái cũ để tránh lặp lại
          prevClickTime.current = 0
        } else {
          // Giới hạn thời gian và khoảng cách để xác định click
          const isClick = clickDuration < 500 && moveDistance < 15
          // Nếu là click thì dispatch sự kiện click trước
          if (isClick) {
            target.dispatchEvent(
              new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: smoothX,
                clientY: smoothY,
                button: 0, // 0 = Chuột trái
                buttons: 0, // 0 = Không nhấn
              }),
            )

            // Lưu thời gian click cuối để kiểm tra double click
            prevClickTime.current = Date.now()
          }
        }

        // Dispatch sự kiện mouse up để kết thúc mouse down
        // Xử lý cả 2 sự kiện mouse event và pointer event
        target.dispatchEvent(
          new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: smoothX,
            clientY: smoothY,
            button: 0, // 0 = Chuột trái
            buttons: 0, // 0 = Không nhấn
          }),
        )

        target.dispatchEvent(
          new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: smoothX,
            clientY: smoothY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0, // 0 = Chuột trái
            buttons: 0, // 0 = Không nhấn
          }),
        )
      }
    } else if (!screenX && !screenY) {
      // Luôn dispatch sự kiện mouse up khi tọa độ không hợp lệ
      window.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: smoothX,
          clientY: smoothY,
          button: 0, // 0 = Chuột trái
          buttons: 0, // 0 = Không nhấn
        }),
      )
    }

    // -------------- Xử lý khi mouse move xảy ra --------------
    if (state.isPinching && wasPinching) {
      const TriggerMouseMoveCallback = (element, x, y) => {
        // Xử lỷ cả 2 trường hợp mouse event và pointer event
        const mouseEvent = new MouseEvent('mousemove', {
          bubbles: true, // Để sự kiện nổi lên cho React bắt
          cancelable: true, // Cho phép dùng preventDefault
          view: window, // Cửa sổ hiện tại
          clientX: x, // Tọa độ X của ngón tay/MediaPipe
          clientY: y, // Tọa độ Y
          button: 0, // 0 = Chuột trái
          buttons: 1, // 1 = Đang nhấn
        })

        const pointerEvent = new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true, // Cho phép dùng preventDefault
          view: window,
          clientX: x, // Tọa độ X của ngón tay/MediaPipe
          clientY: y, // Tọa độ Y
          pointerId: 1, // Luôn giả lập là pointer số 1
          pointerType: 'mouse',
          isPrimary: true, // Luôn là con trỏ chính
          button: 0, // 0 = Chuột trái
          buttons: 1, // 1 = Đang nhấn
        })

        // Trình duyệt cần cả 2 loại sự kiện để nhận biết
        // Trigger cả 2 sự kiện
        element.dispatchEvent(mouseEvent)
        element.dispatchEvent(pointerEvent)
      }

      const target = document.elementFromPoint(screenX, screenY)
      if (target) {
        TriggerMouseMoveCallback(document, screenX, screenY)
      }
    }

    // Xử lý khi Scroll xảy ra (khi không pinching)
    // Chỉ xử lý khi ở trạng thái hover (không pinching)
    if (!state.isPinching && !wasPinching && state.isScrolling) {
      //...
    }

    // Cập nhật trạng thái cũ
    prevState.current = {
      isPinching: state.isPinching,
      isScrolling: state.isScrolling,
    }
  }

  return { cursorRef, updateCursor }
}
