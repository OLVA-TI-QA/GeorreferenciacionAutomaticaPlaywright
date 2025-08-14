import { OlvaTrackings } from '@prisma/client'
import { trackingData } from '../types/dataBaseInterfaces'
import { prisma } from './connection'

/**
 * Get all trackings by date
 */
export async function getTrakingsByDate(
  trackingData: trackingData
): Promise<Pick<OlvaTrackings, 'tracking' | 'address_id' | 'address' | 'address_normalized'>[]> {
  try {
    return await prisma.olvaTrackings.findMany({
      where: {
        fecha_emision: trackingData.fecha_emision,
        emision: trackingData.emision
      },
      select: {
        tracking: true,
        address_id: true,
        address: true,
        address_normalized: true
      },
      orderBy: { tracking: 'desc' },
      take: trackingData.limit
    })
  } catch (error) {
    console.error('Error fetching trackings by date:', error)
    return []
  }
}
