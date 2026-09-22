/**
 * Contract Schema Definition for Store
 */
export const StoreSchema = {
  type: 'object',
  properties: {
    "id": {
        "type": "number"
    },
    "petId": {
        "type": "number"
    },
    "quantity": {
        "type": "number"
    },
    "status": {
        "type": "string"
    },
    "complete": {
        "type": "boolean"
    }
}
};
