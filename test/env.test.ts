import { get } from '../src/utils/env.type'

test('test get env types', () => {
  process.env.PORT = '12345'
  const result = get('PORT', Number)
  expect(result).toBe(12345)
})
