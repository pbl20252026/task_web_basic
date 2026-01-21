import { use, useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

import { useVirtualCursor } from '../../customHooks/useVirtualCursor'

import { caculateDistance } from '../../utils/caculateDistance'

const HandTracker = ({ children }) => {
  // 1. REFS: Dùng Ref để lưu trữ các đối tượng không gây re-render khi thay đổi
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handLandmarkerRef = useRef(null) // Lưu instance AI
  const requestRef = useRef(null) // Lưu ID của animation frame để cancel sau này

  // 2. STATE: Chỉ dùng cho trạng thái UI
  const [isLoaded, setIsLoaded] = useState(false)

  const { cursorRef, updateCursor } = useVirtualCursor()

  // 3. KHỞI TẠO MEDIAPIPE (Chạy 1 lần khi mount)
  useEffect(() => {
    const initHandLandmarker = async () => {
      try {
        // Tải WASM
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm',
        )

        // Cấu hình AI
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU', // QUAN TRỌNG: Dùng GPU để không lag
            },
            runningMode: 'VIDEO',
            numHands: 1, // Chỉ detect 1 tay cho chuột
            minHandDetectionConfidence: 0.7,
            minHandPresenceConfidence: 0.7,
            minTrackingConfidence: 0.7,
          },
        )

        setIsLoaded(true)
        startWebcam() // AI tải xong mới bật cam
      } catch (error) {
        console.error('Lỗi khởi tạo MediaPipe:', error)
      }
    }

    initHandLandmarker()

    // CLEANUP FUNCTION: Chạy khi component bị hủy (unmount)
    return () => {
      // 1. Dừng AI
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close()
      }
      // 2. Dừng vòng lặp
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      // 3. Tắt Camera (đèn xanh tắt)
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, []) // Chỉ chạy 1 lần khi mount

  // 4. BẬT WEBCAM
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          // width: 1280,
          // height: 720,
          frameRate: { ideal: 60 }, // Giới hạn FPS để nhẹ máy
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Sự kiện này đảm bảo video đã load data xong mới bắt đầu predict
        videoRef.current.addEventListener('loadeddata', predictWebcam)
      }
    } catch (err) {
      console.error('Không thể truy cập Webcam:', err)
    }
  }

  // 5. VÒNG LẶP XỬ LÝ (CORE LOOP)
  const predictWebcam = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    // Kiểm tra an toàn
    if (
      !handLandmarkerRef.current ||
      !videoRef.current ||
      !canvasRef.current ||
      video.videoWidth === 0 ||
      video.videoHeight === 0 ||
      video.readyState < 2
    )
      return

    const ctx = canvas.getContext('2d')

    // Đồng bộ kích thước Canvas theo Video
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    let startTimeMs = performance.now()

    // Gửi ảnh sang AI
    const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs)

    // Xóa canvas cũ
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // --- XỬ LÝ KẾT QUẢ TẠI ĐÂY ---
    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        // Ví dụ: Vẽ điểm đầu ngón trỏ
        const middleFingerMCP = landmarks[9]
        const thumbTip = landmarks[4]
        const fingerTip = landmarks[8]

        // scrolling center point
        const middleFingerTip = landmarks[12]

        const x = middleFingerMCP.x * canvas.width
        const y = middleFingerMCP.y * canvas.height

        ctx.beginPath()
        ctx.arc(x, y, 10, 0, 2 * Math.PI)
        ctx.fillStyle = 'red'
        ctx.fill()

        const flippedX = 1 - middleFingerMCP.x // Lật gương trục X

        const distanceBetweenThumbAndFinger = caculateDistance(
          (thumbTip.x - fingerTip.x) * canvas.width,
          (thumbTip.y - fingerTip.y) * canvas.height,
        )

        // const distanceBetweenFingerAndMiddleFinger = caculateDistance(
        //   (fingerTip.x - middleFingerTip.x) * canvas.width,
        //   (fingerTip.y - middleFingerTip.y) * canvas.height,
        // )

        // Gọi cập nhật con trỏ ảo với tọa độ và trạng thái pinch
        updateCursor({
          x: flippedX,
          y: middleFingerMCP.y,
          // Thêm logic nhận diện pinch nếu cần
          state: {
            isPinching: distanceBetweenThumbAndFinger < 40,
            // isScrolling: distanceBetweenFingerAndMiddleFinger < 35,
          },
        })
      }
    }
    // ----------------------------

    // Lặp lại
    requestRef.current = requestAnimationFrame(predictWebcam)
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        background: '#1e1e1e',
      }}
    >
      {/* Loading Indicator */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
          }}
        >
          Đang tải AI Model...
        </div>
      )}

      {children}

      {/* Video Webcam (Ẩn đi hoặc hiện tùy ý, nhớ lật gương) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          // width: '640px',
          height: '200px',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Lật gương
          opacity: 0.5, // Làm mờ video để nổi bật canvas
        }}
      />

      {/* Canvas vẽ tay (Đè lên video) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          // width: '640px',
          height: '200px',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Lật gương theo video
          pointerEvents: 'none', // Để click xuyên qua canvas xuống dưới (nếu cần)
        }}
      />

      {/* Render con trỏ ảo */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'red',
          border: '2px solid white',
          zIndex: 9999,
          pointerEvents: 'none', // <--- BẮT BUỘC PHẢI CÓ
        }}
      />
    </div>
  )
}

export default HandTracker
