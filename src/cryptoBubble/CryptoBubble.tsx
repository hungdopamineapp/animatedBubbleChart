import { Alert, ColorValue, Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native'
import React from 'react'
import { Canvas, Circle, Group, SkiaMutableValue, useValue, runSpring, useTouchHandler, useSharedValueEffect, useComputedValue, useClockValue } from '@shopify/react-native-skia'
import { SpringConfig } from '@shopify/react-native-skia/lib/typescript/src/animation/types'
import { clamp } from 'react-native-redash'

type Layout = {
  width: number
  height: number
}

type Coordinates = {
  x: number
  y: number
}

type BubbleLayout = {
  r: number
  color: ColorValue
}

type CircleType = {
  x: SkiaMutableValue<number>
  y: SkiaMutableValue<number>
  r: SkiaMutableValue<number>
  velocity: {
    x: SkiaMutableValue<number>
    y: SkiaMutableValue<number>
  }
}

const NUM_OF_BUBBLE = 100

const SPRING_CONFIG: {normal: SpringConfig, fast: SpringConfig} = {
  normal: {
    damping: 15,
    velocity: 150,
    stiffness: 2
  },
  fast: {
    damping: 20,
    velocity: 550,
    stiffness: 10
  }
}

const distance = (x1: number, y1: number, x2: number, y2: number) => {
  const xDist = x2 - x1
  const yDist = y2 - y1

  return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2))
}

function randomIntInner(min: number, maxCoor: number) {
  const dist = Math.random() * ( maxCoor - min * 3 )
  return min + dist
}

const findCircle = (circles: CircleType[], x: number, y: number) => {
  let foundIndex = -1
  for (let i = 0; i < circles.length; i++) {
    const dist1 = distance(x, y, circles[i].x.current, circles[i].y.current)
    if (dist1 <= circles[i].r.current) {
      if (foundIndex == -1) {
        foundIndex = i
      } else {
        const dist2 = distance(x, y, circles[foundIndex].x.current, circles[foundIndex].y.current)
        if (dist1 < dist2) {
          foundIndex = i
        }
      }
    }
  }

  return foundIndex >= 0 ? { data: circles[foundIndex], index: foundIndex } : null
}

const rotate = (velocity: { x: number, y: number }, angle: number) => {
  const rotatedVelocities = {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
  }

  return rotatedVelocities
}

const resolveCollision = (circle: CircleType, otherCircle: CircleType) => {
  const { x: x1, y: y1, velocity: velocity1 } = circle
  const { x: x2, y: y2, velocity: velocity2 } = otherCircle

  const xVelocityDiff = velocity1.x.current - velocity2.x.current
  const yVelocityDiff = velocity1.y.current - velocity2.y.current

  const xDist = x2.current - x1.current
  const yDist = y2.current - y1.current

  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    const angle =-Math.atan2(y2.current - y1.current, x2.current - x1.current)
    const u1 = rotate({x: velocity1.x.current, y: velocity1.y.current}, angle)
    const u2 = rotate({x: velocity2.x.current, y: velocity2.y.current}, angle)
    const v1 = {
      x: u2.x * 2 * 0.5,
      y: u1.y
    }
    const v2 = {
      x: u1.x * 2 * 0.5,
      y: u2.y
    }
    const vFinal1 = rotate(v1, -angle)
    const vFinal2 = rotate(v2, -angle)

    velocity1.x.current = vFinal1.x
    velocity1.y.current = vFinal1.y

    velocity2.x.current = vFinal2.x
    velocity2.y.current = vFinal2.y
  }
}

const useSetup = (data: number[], containerLayout?: Layout) => {
  const [bubbles, setBubbles] = React.useState<{ value: number; layout: BubbleLayout; }[]>([])

  React.useEffect(() => {
    if (!!containerLayout) {
      const totalValue = data.reduce((a, b) => Math.abs(a) + Math.abs(b), 0)
      const avgValue = totalValue / data.length
      const avgRadius = Math.sqrt(containerLayout.width * containerLayout.width * 0.6 / NUM_OF_BUBBLE) / 2
      const layout = data.map(e => {
        const r = Math.floor(clamp(avgRadius * Math.abs(e) / avgValue, avgRadius/2, avgRadius*2))
        const color = e > 0 ? '#00D64D' : '#FF3A00'
        return { r, color }
      })
      
      setBubbles(data.map((e, i) => ({
        value: e,
        layout: layout[i]
      })))
    }
  }, [containerLayout?.width, containerLayout?.height, data.length])

  return { bubbles, data }
}

const useDraw = (bubbles: { value: number; layout: BubbleLayout; }[], containerLayout?: Layout) => {
  const circles: CircleType[] = Array.from(Array(NUM_OF_BUBBLE), () => ({
    x: useValue(0),
    y: useValue(0),
    r: useValue(0),
    velocity: {
      x: useValue(Math.random() * 10 - 5),
      y: useValue(Math.random() * 10 - 5),
    }
  }))
  React.useEffect(() => {
    if (!!containerLayout && bubbles.length > 0) {
      circles.map((circle) => {
        circle.x.current = containerLayout.width / 2
        circle.y.current = containerLayout.height / 2
      })
      let cs: Coordinates[] = []
      for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i]
        let x = randomIntInner(bubble.layout.r, containerLayout.width)
        let y = randomIntInner(bubble.layout.r, containerLayout.height)

        if (i !== 0) {
          for (let j = 0; j < cs.length; j++) {
            const dist = distance(x, y, cs[j].x, cs[j].y)
            const isOverlaps = dist < bubble.layout.r + bubbles[j].layout.r
            if (isOverlaps) {
              x = randomIntInner(bubble.layout.r, containerLayout.width)
              y = randomIntInner(bubble.layout.r, containerLayout.height)

              j = -1
            } else {
              if (j == cs.length - 1) {
                cs.push({x, y})
                break
              }
            }
          }
        } else {
          cs.push({x, y})
        }
        if (i == bubbles.length - 1 && cs.length == bubbles.length) {
          circles.map((circle, index) => {
            runSpring(circle.x, cs[index].x, SPRING_CONFIG.normal)
            runSpring(circle.y, cs[index].y, SPRING_CONFIG.normal)
            circle.r.current = bubbles[index].layout.r
          })
        }
      }
    }
  }, [containerLayout?.width, containerLayout?.height, bubbles.length])

  return { circles }
}

type CryptoBubbleProps = {
  numOfBubble: number,
  scaleFromMinToMaxSize: number,
  velocity: number
}
const {width} = Dimensions.get('window')

const containerLayout: Layout = {
  width: width,
  height: width / 9 * 16
}

const CryptoBubble: React.FC<CryptoBubbleProps> = () => {
  const numOfBubble = NUM_OF_BUBBLE
  const data = Array(numOfBubble).fill(0).map(() => Math.random() * 1000 - 500)

  const { bubbles } = useSetup(data, containerLayout)
  const { circles } = useDraw(bubbles, containerLayout)

  const isCanvasReady = !!containerLayout && bubbles.length > 0 && circles.length == bubbles.length
  const clock = useClockValue()
  const focusedIndex = useValue<number>(-1)
  const transition = useValue<number>(-1)

  useComputedValue(() => {
    if (clock.current >= 3500) {
      if (focusedIndex.current > -1) {
        startGravity(containerLayout, focusedIndex.current)
      }
    }
  }, [clock, focusedIndex, transition]);

  const touchHandler = useTouchHandler({
    onStart: ({ x, y }) => {
      transition.current = -1
      focusedIndex.current = -1
      const foundCircle = findCircle(circles, x, y)
      if (!!foundCircle) {
        focusedIndex.current = foundCircle.index
      }
    },
    onActive: ({ x, y }) => {
      if (focusedIndex.current >= 0) {
        const circle = circles[focusedIndex.current]
        runSpring(circle.x, clamp(x, circle.r.current, (containerLayout?.width ?? 350) - circle.r.current), SPRING_CONFIG.normal)
        runSpring(circle.y, clamp(y, circle.r.current, (containerLayout?.height ?? 600) - circle.r.current), SPRING_CONFIG.normal)
        transition.current = distance(x, y, circle.x.current, circle.y.current)
      }
    },
    onEnd: () => {
      if (focusedIndex.current >= 0) {        
        if (transition.current < 0) {
          // do onPress here
          Alert.alert(
            '',
            `
            24h%: ${Math.round(bubbles[focusedIndex.current].value * 100)/100}\n
            x: ${circles[focusedIndex.current].x.current}\n
            y: ${circles[focusedIndex.current].y.current}\n
            r: ${circles[focusedIndex.current].r.current}
          `)
        }
      }
    },
  }, [bubbles.length, containerLayout]);

  function startGravity(containerLayout: Layout, index: number) {
    let j = 0
    const length = circles.length
    const { x: x1, y: y1, r: r1, velocity: velocity1 } = circles[index]

    for (j = 0; j < length; j++) {
      if (j == index || j == focusedIndex.current) continue
      const { x: x2, y: y2, r: r2, velocity: velocity2 } = circles[j]
      if (distance(x1.current, y1.current, x2.current, y2.current) - (r1.current + r2.current) <= 0) {
        resolveCollision(circles[j], circles[index])
        if (
          x2.current + velocity2.x.current <= r2.current ||
          x2.current + velocity2.x.current >= containerLayout.width - r2.current
        ) {
          velocity2.x.current = -velocity2.x.current
        }
    
        if (
          y2.current + velocity2.y.current <= r2.current ||
          y2.current + velocity2.y.current >= containerLayout.height*0.87 - r2.current
        ) {
          velocity2.y.current = -velocity2.y.current
        }
        
        x2.current += velocity2.x.current
        y2.current += velocity2.y.current

        startGravity(containerLayout, j)
      }
    }
  }

  return (
    <View style={styles.flex1}>
      <Canvas style={containerLayout} mode='continuous' onTouch={touchHandler}>
        {isCanvasReady && (
          circles.map(({ x, y, r }, index) => {
            return (
              <Group key={index.toString()} style="stroke" strokeWidth={10} color={bubbles[index].layout.color.toString()}>
                <Circle key={index.toString()} cx={x} cy={y} r={r} strokeWidth={1} />
              </Group>
            )
          })
        )}
      </Canvas>
    </View>
  )
}

export default CryptoBubble

const styles = StyleSheet.create({
  flex1: { flex: 1 }
})