/**
 * Contract Schema Definition for Pet
 */
export const PetSchema = {
  type: 'object',
  properties: {
    "id": {
        "type": "number"
    },
    "name": {
        "type": "string"
    },
    "status": {
        "type": "string"
    }
}
};
