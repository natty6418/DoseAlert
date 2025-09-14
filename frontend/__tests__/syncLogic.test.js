// __tests__/syncLogic.test.js

import { getDirtyItems } from '../services/sync/dbUtils.js';
import * as database from '../services/database.js';
import { jest } from '@jest/globals';
import { and, eq } from 'drizzle-orm';

const { medications, schedules } = database;

describe('Sync Logic', () => {
  describe('getDirtyItems', () => {
    afterEach(() => {
        jest.restoreAllMocks(); // Use restoreAllMocks to remove spies
    });

    it('should correctly fetch dirty items for tables with a userId column', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: 1, name: 'med1', isDirty: true, userId: 1 }]),
      };
      jest.spyOn(database, 'getDatabase').mockReturnValue(mockDb);

      const items = await getDirtyItems(medications, 1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(medications);
      expect(mockDb.where).toHaveBeenCalledWith(and(
        eq(medications.isDirty, true),
        eq(medications.userId, 1)
      ));
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('med1');
    });

    it('should correctly fetch dirty items for tables with a medicationId column by joining', async () => {
      const mockSchedules = [{ id: 1, timeOfDay: '08:00', isDirty: true, medicationId: 1 }];
      const mockJoinResult = mockSchedules.map(s => ({ schedules: s, medications: { id: 1, userId: 1 } }));

      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockJoinResult),
      };
      jest.spyOn(database, 'getDatabase').mockReturnValue(mockDb);

      const items = await getDirtyItems(schedules, 1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(schedules);
      expect(mockDb.leftJoin).toHaveBeenCalledWith(medications, eq(schedules.medicationId, medications.id));
      expect(mockDb.where).toHaveBeenCalledWith(and(
        eq(schedules.isDirty, true),
        eq(medications.userId, 1)
      ));
      expect(items).toHaveLength(1);
      expect(items[0].timeOfDay).toBe('08:00');
    });

    import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

    it('should return an empty array for tables that cannot be filtered by user', async () => {
        const mockUnfilterableTable = sqliteTable('unfilterable', {
            id: text('id'),
        });
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  
        const items = await getDirtyItems(mockUnfilterableTable, 1);
  
        expect(items).toEqual([]);
        expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot get dirty items for table unfilterable as it cannot be filtered by user.');
  
        consoleWarnSpy.mockRestore();
      });
  });
});
