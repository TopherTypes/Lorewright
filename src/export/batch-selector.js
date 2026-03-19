/**
 * Batch Selector
 * State management for selecting multiple cards for batch export
 */

export class BatchSelector {
  constructor() {
    this.selectedIds = new Set();
    this.selectedEntities = new Map(); // id → entity
    this.entityType = null; // 'creature' or 'item'
    this.listeners = [];
  }

  /**
   * Toggle selection of an entity
   * @param {string} id - Entity ID
   * @param {object} entity - Entity object
   * @param {string} type - Entity type ('creature' or 'item')
   */
  toggle(id, entity, type = null) {
    if (type && !this.entityType) {
      this.entityType = type;
    }

    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
      this.selectedEntities.delete(id);
    } else {
      this.selectedIds.add(id);
      this.selectedEntities.set(id, entity);
    }

    this.notifyListeners();
  }

  /**
   * Check if an entity is selected
   * @param {string} id
   * @returns {boolean}
   */
  isSelected(id) {
    return this.selectedIds.has(id);
  }

  /**
   * Get count of selected entities
   * @returns {number}
   */
  getCount() {
    return this.selectedIds.size;
  }

  /**
   * Get all selected entities as array
   * @returns {object[]}
   */
  getSelectedEntities() {
    return Array.from(this.selectedEntities.values());
  }

  /**
   * Get selected IDs as array
   * @returns {string[]}
   */
  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  /**
   * Clear all selections
   */
  clear() {
    this.selectedIds.clear();
    this.selectedEntities.clear();
    this.entityType = null;
    this.notifyListeners();
  }

  /**
   * Select all entities from a list
   * @param {object[]} entities - Array of entity objects with 'meta.id' property
   * @param {string} type - Entity type
   */
  selectAll(entities, type) {
    this.entityType = type;
    for (const entity of entities) {
      const id = entity.meta.id;
      this.selectedIds.add(id);
      this.selectedEntities.set(id, entity);
    }
    this.notifyListeners();
  }

  /**
   * Register listener for selection changes
   * @param {function} callback - Called when selection changes
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of selection change
   * @private
   */
  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener({
          count: this.selectedIds.size,
          selectedIds: this.getSelectedIds(),
          entityType: this.entityType,
        });
      } catch (error) {
        console.error('Error in batch selector listener:', error);
      }
    }
  }
}

/**
 * Global batch selector instance (one per app)
 */
export const globalBatchSelector = new BatchSelector();

export default BatchSelector;
