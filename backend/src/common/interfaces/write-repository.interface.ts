/**
 * Generic write repository interface
 * Defines common write operations for data access layer
 * Follows the Interface Segregation Principle - clients only depend on write operations
 */
export interface IWriteRepository<T, TCreateInput = unknown, TUpdateInput = unknown, TWhereInput = unknown> {
  /**
   * Create a new entity
   * @param data - The data to create the entity with
   * @returns The created entity
   */
  create(data: TCreateInput): Promise<T>;

  /**
   * Create multiple entities at once
   * @param data - Array of data to create entities with
   * @returns The number of entities created
   */
  createMany(data: TCreateInput[]): Promise<{ count: number }>;

  /**
   * Update an entity by its unique identifier
   * @param id - The unique identifier of the entity
   * @param data - The data to update the entity with
   * @returns The updated entity
   */
  update(id: string, data: TUpdateInput): Promise<T>;

  /**
   * Update multiple entities matching the given conditions
   * @param where - Query conditions to match entities
   * @param data - The data to update the entities with
   * @returns The number of entities updated
   */
  updateMany(where: TWhereInput, data: TUpdateInput): Promise<{ count: number }>;

  /**
   * Delete an entity by its unique identifier
   * @param id - The unique identifier of the entity
   * @returns The deleted entity
   */
  delete(id: string): Promise<T>;

  /**
   * Delete multiple entities matching the given conditions
   * @param where - Query conditions to match entities
   * @returns The number of entities deleted
   */
  deleteMany(where: TWhereInput): Promise<{ count: number }>;

  /**
   * Update an existing entity or create it if it doesn't exist
   * @param where - Query conditions to find the entity
   * @param create - Data to create the entity if it doesn't exist
   * @param update - Data to update the entity if it exists
   * @returns The created or updated entity
   */
  upsert(where: TWhereInput, create: TCreateInput, update: TUpdateInput): Promise<T>;
}
