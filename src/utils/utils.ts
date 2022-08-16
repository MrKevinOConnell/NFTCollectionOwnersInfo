export function getMillisToSleep (retryHeaderString: string) {
    let millisToSleep = Math.round(parseFloat(retryHeaderString) * 1000)
    if (isNaN(millisToSleep)) {
      millisToSleep = Math.max(0, new Date(retryHeaderString) as any - (new Date() as any))
    }
    return millisToSleep
  }
  export const fetchAndRetryIfNecessary: any = async (callAPIFn: any) => {
    const response = await callAPIFn()
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after')
      const millisToSleep = getMillisToSleep(retryAfter)
      await sleep(millisToSleep)
      return fetchAndRetryIfNecessary(callAPIFn) as any
    }
    return response
  }

  export function sleep (milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
  }

