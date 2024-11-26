import { z } from 'zod'

const uint8schema = z.number().min(0).max(255)

export const uint8arraySchema = z.array(uint8schema).transform((data) => new Uint8Array(data))
