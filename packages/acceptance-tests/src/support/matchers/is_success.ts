import { Matcher } from 'hamjest'
import { Response } from 'superagent'

export const isSuccess: () => Matcher = () => ({
  matches: (response: Response) => {
    return response.status === 200
  },
  describeTo: (description) => {
    description.append('A response with status code 200')
  },
  describeMismatch: (resp, description) => {
    description.append('A response with status code ')
    description.appendValue(resp.statusCode)
    description.append(' and body ')
    description.appendValue(resp.body)
  },
})
