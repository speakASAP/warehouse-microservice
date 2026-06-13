import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BatchWarehouseLogisticsDto } from '../src/warehouses/dto/warehouse.dto';

describe('BatchWarehouseLogisticsDto', () => {
  async function validateBody(body: unknown) {
    return validate(plainToInstance(BatchWarehouseLogisticsDto, body));
  }

  it('accepts a non-empty product id list for cross-service logistics reads', async () => {
    const errors = await validateBody({ productIds: ['product-1', 'product-2'] });

    expect(errors).toHaveLength(0);
  });

  it('rejects missing, empty, and oversized logistics batch requests', async () => {
    await expect(validateBody({})).resolves.not.toHaveLength(0);
    await expect(validateBody({ productIds: [] })).resolves.not.toHaveLength(0);
    await expect(validateBody({ productIds: ['x'.repeat(201)] })).resolves.not.toHaveLength(0);
  });

  it('rejects non-string product identifiers before Warehouse route planning', async () => {
    const errors = await validateBody({ productIds: ['product-1', 42] });

    expect(errors).not.toHaveLength(0);
  });
});
