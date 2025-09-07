import Svg, { Path, Rect } from "react-native-svg"

export const MuslimIconSvg = ({ color, backgroundColor, width = 48, height = 48, testID }) => {
  // Extract colors as variables
  const brownColor = color || "rgb(148, 87, 30)"
  const greenColor = backgroundColor || "rgb(186, 218, 85)" // Use background color for transparency effect
  const strokeColor = "rgb(0, 0, 0)"
  
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={width}
      height={height}
      testID={testID}
      preserveAspectRatio="xMidYMid meet"
      transform="scale(-1, 1)"
    >
      {/* Background rectangle - expanded to fill full height */}
      <Path 
        d="M -0.686 0 L 220 0 L 220 500 L -0.686 500 L -0.686 0 Z" 
        fill={brownColor}
      />
      
      {/* Star shape - scaled and repositioned to fill height */}
      <Path 
        d="M 228.197 20 L 228.197 480 C 226.344 482 223.296 484 221.126 484 C 218.955 484 215.908 482 214.054 480 L 170.737 436 L 110.881 436 C 107.479 435.7 103.345 434 101.81 432.5 C 100.275 431 98.099 427.1 97.881 424 L 97.881 364 L 54.142 320.1 C 51.598 317.2 49.214 313.2 49.214 310 C 49.214 306.8 51.598 302.8 54.142 299.9 L 97.881 256 L 97.881 196 C 98.099 192.9 100.275 189 101.81 187.5 C 103.345 186 107.479 184.3 110.881 184 L 170.786 184 L 214.054 140 C 215.908 138 218.955 136 221.126 136 C 223.297 136 226.344 138 228.197 140 Z" 
        stroke={strokeColor}
        strokeWidth="8"
        fill={greenColor}
        transform="matrix(1.2, 0, 0, 1.4, -35, -180)"
      />
      
      {/* Right rectangle - expanded to fill full height */}
      <Rect 
        x="220" 
        y="0" 
        width="30" 
        height="500" 
        fill={greenColor}
      />
    </Svg>
  )
}
