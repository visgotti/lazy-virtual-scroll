import { capitalize } from "."

export const scrollOuterStyle = (lengthProp: 'width' | 'height', overrides?: any) => {
  return {
    display: 'inline-block',
    overflow: 'auto',
    [`max${capitalize(lengthProp)}`]: '100%', 
    [`min${capitalize(lengthProp)}`]: '100%',
    ...(overrides || {})
  }
}

export const scrollInnerStyle = (scrollLength: number, scrollMargin: number, flexDirection: 'row' | 'column', overrides?: any) => {
  const marginProp = flexDirection === 'row' ? 'marginLeft' : 'marginTop';
  const lengthProp = flexDirection === 'row' ? 'width' : 'height';
  return {
    display: 'flex',
    overflow: 'hidden',
    flexDirection, 
    [lengthProp]: `${scrollLength}px`,
    [`max${capitalize(lengthProp)}`]: `${scrollLength}px`, 
    [`min${capitalize(lengthProp)}`]: `${scrollLength}px`, 
    [`${marginProp}`]: `${scrollMargin}px`,
    ...(overrides || {})
  }
}