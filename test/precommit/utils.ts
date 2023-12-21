function arrDiff(a1, a2) {
  const a = []
  const diff = []

  for (const i of a1) {
    a[a1[i]] = true
  }

  for (const i of a2) {
    if (a[a2[i]]) {
      delete a[a2[i]]
    } else {
      a[a2[i]] = true
    }
  }

  // eslint-disable-next-line
  for (const k in a) {
    diff.push(k)
  }

  return diff
}

export default arrDiff
