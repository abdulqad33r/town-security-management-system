export const pickFields = <T, K extends keyof T>(
  obj: T,
  fields: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  fields.forEach(field => {
    if (obj[field] !== undefined) {
      result[field] = obj[field]
    }
  })
  return result
}

export const omitFields = <T, K extends keyof T>(
  obj: T,
  fields: K[]
): Omit<T, K> => {
  const result = { ...obj }

  fields.forEach(field => {
    delete result[field]
  })

  return result as Omit<T, K>
}
