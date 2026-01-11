export const mapOrther = (originArray, oderredArray, key) => {
  const newOriginArray = [...originArray]

  newOriginArray.sort((a, b) => {
    return oderredArray.indexOf(a[key]) - oderredArray.indexOf(b[key])
  })

  return newOriginArray
}
