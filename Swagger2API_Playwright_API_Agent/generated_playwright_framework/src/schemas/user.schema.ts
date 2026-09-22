/**
 * Contract Schema Definition for User
 */
export const UserSchema = {
  type: 'object',
  properties: {
    "id": {
        "type": "number"
    },
    "username": {
        "type": "string"
    },
    "email": {
        "type": "string"
    },
    "password": {
        "type": "string"
    }
}
};
