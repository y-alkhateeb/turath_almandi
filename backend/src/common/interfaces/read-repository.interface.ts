/**
 * Generic read repository interface
 * Defines common read operations for data access layer
 * Follows the Interface Segregation Principle - clients only depend on read operations
 */
export interface IReadRepository<T, TWhereInput = unknown, TOrderByInput = unknown> {
  /**
   * Find a single entity by its unique identifier
   * @param id - The unique identifier of the entity
   * @returns The found entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find a single entity matching the given conditions
   * @param where - Query conditions
   * @returns The found entity or null if not found
   */
  findOne(where: TWhereInput): Promise<T | null>;

  /**
   * Find all entities matching the given conditions with pagination
   * @param params - Query parameters including where, orderBy, skip, take
   * @returns Array of entities matching the conditions
   */
  findAll(params?: {
    where?: TWhereInput;
    orderBy?: TOrderByInput;
    skip?: number;
    take?: number;
  }): Promise<T[]>;

  /**
   * Count entities matching the given conditions
   * @param where - Query conditions
   * @returns The number of entities matching the conditions
   */
  count(where?: TWhereInput): Promise<number>;

  /**
   * Check if an entity exists matching the given conditions
   * @param where - Query conditions
   * @returns True if at least one entity exists, false otherwise
   */
  exists(where: TWhereInput): Promise<boolean>;
}
