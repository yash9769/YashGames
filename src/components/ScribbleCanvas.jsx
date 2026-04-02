import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

function hexToRgba(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 255
  } : { r: 0, g: 0, b: 0, a: 255 };
}

// Optimization for flood fill
function matchStartColor(pixelPos, colorLayer, startR, startG, startB) {
  const r = colorLayer[pixelPos];
  const g = colorLayer[pixelPos + 1];
  const b = colorLayer[pixelPos + 2];
  return (r === startR && g === startG && b === startB);
}

function colorPixel(pixelPos, colorLayer, fillR, fillG, fillB) {
  colorLayer[pixelPos] = fillR;
  colorLayer[pixelPos + 1] = fillG;
  colorLayer[pixelPos + 2] = fillB;
  colorLayer[pixelPos + 3] = 255;
}

const ScribbleCanvas = forwardRef(({ isDrawer, channel, activeColor = '#000000', activeSize = 4, activeTool = 'brush' }, ref) => {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  
  const broadcastThrottle = useRef(null)
  const pendingStroke = useRef([])
  
  // History for undo
  const history = useRef([])
  
  useImperativeHandle(ref, () => ({
    undo: () => {
      if (!isDrawer) return
      handleUndo()
      if (channel) {
        channel.send({ type: 'broadcast', event: 'undo_canvas', payload: {} })
      }
    },
    clear: () => {
      if (!isDrawer) return
      handleClear()
      if (channel) {
        channel.send({ type: 'broadcast', event: 'clear_canvas', payload: {} })
      }
    }
  }))

  const saveHistoryState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (history.current.length >= 20) history.current.shift() // keep last 20 states
    history.current.push(canvas.toDataURL())
  }

  const handleUndo = () => {
    if (history.current.length === 0) {
      handleClear()
      return
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const prev = history.current.pop()
    
    // If we pop and there is no previous, means we just undid the first stroke
    if (!prev) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Fill white background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    const img = new Image()
    img.src = prev
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // We do not scale here because toDataURL captures the actual pixels
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(img, 0, 0)
      ctx.restore()
    }
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    history.current = []
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Only set resolution once
    if (canvas.width !== canvas.offsetWidth) {
       // Using 1x resolution for simpler flood fill (2x makes flood fill very slow and complex)
       // Skribbl is 1x pixel art style anyway!
       const rect = canvas.getBoundingClientRect()
       canvas.width = 800
       canvas.height = 600
       
       const ctx = canvas.getContext('2d')
       ctx.lineCap = 'round'
       ctx.lineJoin = 'round'
       
       // fill white by default
       ctx.fillStyle = '#FFFFFF'
       ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  useEffect(() => {
    if (isDrawer || !channel) return

    const drawLine = (points, color, size) => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()
    }

    const fillBucket = (x, y, colorHex) => {
       performFloodFill(x, y, colorHex)
    }

    const sub = channel.on('broadcast', { event: 'draw_stroke' }, (payload) => {
      const { points, color, size } = payload.payload
      if (!points || points.length < 2) return
      drawLine(points, color, size)
    }).on('broadcast', { event: 'fill_bucket' }, (payload) => {
      const { x, y, color } = payload.payload
      fillBucket(x, y, color)
    }).on('broadcast', { event: 'clear_canvas' }, () => {
      handleClear()
    }).on('broadcast', { event: 'undo_canvas' }, () => {
      handleUndo()
    })

    return () => {}
  }, [isDrawer, channel])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    let clientX, clientY
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    // Scale accurately since canvas internal size is 800x600 but displayed size varies
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const broadcastPoints = () => {
    if (pendingStroke.current.length === 0 || !channel) return
    
    channel.send({
      type: 'broadcast',
      event: 'draw_stroke',
      payload: { 
        points: [...pendingStroke.current],
        color: activeColor,
        size: activeSize
      }
    })
    
    const lastPoint = pendingStroke.current[pendingStroke.current.length - 1]
    pendingStroke.current = [lastPoint]
  }

  const performFloodFill = (startX, startY, fillColorHex) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    const colorData = ctx.getImageData(0, 0, width, height)
    const colorLayer = colorData.data
    
    const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4
    const startR = colorLayer[startPos]
    const startG = colorLayer[startPos + 1]
    const startB = colorLayer[startPos + 2]
    
    const fillRgba = hexToRgba(fillColorHex)
    
    if (startR === fillRgba.r && startG === fillRgba.g && startB === fillRgba.b) {
      return // Same color, do nothing
    }

    const pixelStack = [[Math.floor(startX), Math.floor(startY)]]

    while (pixelStack.length) {
      const newPos = pixelStack.pop()
      const x = newPos[0]
      let y = newPos[1]
      
      let pixelPos = (y * width + x) * 4
      
      // Go up as long as color matches
      while (y-- >= 0 && matchStartColor(pixelPos, colorLayer, startR, startG, startB)) {
        pixelPos -= width * 4
      }
      
      pixelPos += width * 4
      ++y
      
      let reachLeft = false
      let reachRight = false
      
      while (y++ < height - 1 && matchStartColor(pixelPos, colorLayer, startR, startG, startB)) {
        colorPixel(pixelPos, colorLayer, fillRgba.r, fillRgba.g, fillRgba.b)
        
        if (x > 0) {
          if (matchStartColor(pixelPos - 4, colorLayer, startR, startG, startB)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, y])
              reachLeft = true
            }
          } else if (reachLeft) {
            reachLeft = false
          }
        }
        
        if (x < width - 1) {
          if (matchStartColor(pixelPos + 4, colorLayer, startR, startG, startB)) {
            if (!reachRight) {
              pixelStack.push([x + 1, y])
              reachRight = true
            }
          } else if (reachRight) {
            reachRight = false
          }
        }
        
        pixelPos += width * 4
      }
    }
    
    ctx.putImageData(colorData, 0, 0)
  }

  const startDrawing = (e) => {
    if (!isDrawer) return
    e.preventDefault()
    
    const coords = getCoordinates(e)
    saveHistoryState() // save before we change it

    if (activeTool === 'fill') {
       performFloodFill(coords.x, coords.y, activeColor)
       if (channel) {
         channel.send({
           type: 'broadcast',
           event: 'fill_bucket',
           payload: { x: coords.x, y: coords.y, color: activeColor }
         })
       }
       return
    }

    isDrawing.current = true
    lastPos.current = coords
    pendingStroke.current = [coords]
    
    // Draw a single dot if they just click
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = activeColor
    ctx.lineWidth = activeSize
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  const draw = (e) => {
    if (!isDrawer || !isDrawing.current || activeTool !== 'brush') return
    e.preventDefault()
    
    const coords = getCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    ctx.strokeStyle = activeColor
    ctx.lineWidth = activeSize
    
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    
    lastPos.current = coords
    pendingStroke.current.push(coords)
    
    if (!broadcastThrottle.current) {
      broadcastThrottle.current = setTimeout(() => {
        broadcastPoints()
        broadcastThrottle.current = null
      }, 50) 
    }
  }

  const stopDrawing = () => {
    if (!isDrawer || !isDrawing.current) return
    isDrawing.current = false
    
    if (broadcastThrottle.current) {
      clearTimeout(broadcastThrottle.current)
      broadcastThrottle.current = null
    }
    broadcastPoints()
    pendingStroke.current = []
  }

  return (
    <div className="w-full h-full bg-white relative">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className={`w-full h-full object-contain ${isDrawer ? (activeTool === 'fill' ? 'cursor-cell' : 'cursor-crosshair') : 'pointer-events-none'}`}
      />
    </div>
  )
})

export default ScribbleCanvas
