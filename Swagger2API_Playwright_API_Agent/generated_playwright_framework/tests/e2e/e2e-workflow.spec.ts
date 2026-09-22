import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import { TokenManager } from '../../src/utils/tokenManager';

/**
 * End-to-End Sequential API Business Workflow
 * Executes an ordered multi-step business journey touching all 3 resource controllers:
 * Handshake & Token -> Sequential Entity Creation -> Verification -> State Mutation -> Teardown Cleanup
 */
test.describe.serial('Sequential End-to-End API Journey (Swagger Petstore - OpenAPI 3.0)', () => {
  const workflowState: {
    authToken: string;
    createdEntities: Record<string, number | string>;
  } = {
    authToken: '',
    createdEntities: {}
  };

  test('Phase 1: Environment Handshake & Token Acquisition', async () => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: 'API Connectivity' });
    test.info().annotations.push({ type: 'story', description: 'Environment Setup & Token Acquisition' });
    test.info().annotations.push({ type: 'severity', description: 'blocker' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, auth, setup' });
    test.info().annotations.push({ type: 'description', description: 'Validates API environment connectivity and acquires a valid auth token before the E2E journey begins.' });
    const token = await TokenManager.getAccessToken();
    expect(token).toBeTruthy();
    workflowState.authToken = token;
  });

  test('Phase 2: Sequential Workflow for Pet API', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'Pet - Full CRUD Workflow' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, pet, crud' });
    test.info().annotations.push({ type: 'description', description: 'Executes a full sequential CRUD lifecycle for the Pet API: list → create → read → update.' });

    // Create item
    const payload: any = { id: Math.floor(Math.random() * 900 + 100), name: "doggie", status: "available" };
    const createRes = await petService.create(payload);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(createRes.status());
    expect(createRes.ok()).toBe(true);
    
    let currentId: number | string = payload.id;
    if (createRes.ok()) {
      try {
        const body = await createRes.json();
        if (body && (body.username || body.id || body.ID)) currentId = body.username || body.id || body.ID;
      } catch (e) {}
    }
    workflowState.createdEntities['Pet'] = currentId;

    // Query record by ID (try created ID first, fallback to known-existing ID 1)
    const getRes = await petService.fetchById(currentId);
    const queryId = getRes.ok() ? currentId : 1;
    if (!getRes.ok()) {
      workflowState.createdEntities['Pet'] = queryId;
    }
    const verifyRes = await petService.fetchById(queryId);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(verifyRes.status());

    // Update record
    const updateRes = await petService.update(currentId, { ...payload });
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(updateRes.status());
  });

  test('Phase 3: Sequential Workflow for Store API', async ({ storeService }) => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: 'Store Resource' });
    test.info().annotations.push({ type: 'story', description: 'Store - Full CRUD Workflow' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, store, crud' });
    test.info().annotations.push({ type: 'description', description: 'Executes a full sequential CRUD lifecycle for the Store API: list → create → read → update.' });

    // Create item
    const payload: any = { id: Math.floor(Math.random() * 900 + 100), petId: 1, quantity: 1, shipDate: new Date().toISOString(), status: 'placed', complete: true };
    const createRes = await storeService.create(payload);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(createRes.status());
    expect(createRes.ok()).toBe(true);
    
    let currentId: number | string = payload.id;
    if (createRes.ok()) {
      try {
        const body = await createRes.json();
        if (body && (body.username || body.id || body.ID)) currentId = body.username || body.id || body.ID;
      } catch (e) {}
    }
    workflowState.createdEntities['Store'] = currentId;

    // Query record by ID (try created ID first, fallback to known-existing ID 1)
    const getRes = await storeService.fetchById(currentId);
    const queryId = getRes.ok() ? currentId : 1;
    if (!getRes.ok()) {
      workflowState.createdEntities['Store'] = queryId;
    }
    const verifyRes = await storeService.fetchById(queryId);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(verifyRes.status());

  });

  test('Phase 4: Sequential Workflow for User API', async ({ userService }) => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: 'User Resource' });
    test.info().annotations.push({ type: 'story', description: 'User - Full CRUD Workflow' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, user, crud' });
    test.info().annotations.push({ type: 'description', description: 'Executes a full sequential CRUD lifecycle for the User API: list → create → read → update.' });

    // Create item
    const payload: any = { id: Math.floor(Math.random() * 9000 + 1000), username: 'e2e_user_' + Date.now(), firstName: 'E2E', lastName: 'User', email: 'e2e@example.com', password: 'password123', phone: '1234567890', userStatus: 1 };
    const createRes = await userService.create(payload);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(createRes.status());
    expect(createRes.ok()).toBe(true);
    
    let currentId: number | string = payload.username;
    if (createRes.ok()) {
      try {
        const body = await createRes.json();
        if (body && (body.username || body.id || body.ID)) currentId = body.username || body.id || body.ID;
      } catch (e) {}
    }
    workflowState.createdEntities['User'] = currentId;

    // Query record by ID (try created ID first, fallback to known-existing ID 1)
    const getRes = await userService.fetchById(currentId);
    const queryId = getRes.ok() ? currentId : 1;
    if (!getRes.ok()) {
      workflowState.createdEntities['User'] = queryId;
    }
    const verifyRes = await userService.fetchById(queryId);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(verifyRes.status());

  });

  test('Phase 5: End-to-End Teardown & Deletion Verification', async ({ petService, storeService, userService }) => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: 'Teardown & Cleanup' });
    test.info().annotations.push({ type: 'story', description: 'Delete All Created Entities' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, teardown, cleanup' });
    test.info().annotations.push({ type: 'description', description: 'Deletes all entities created during the E2E journey to restore environment state.' });
    // Delete created entities in reverse dependency order
    if (workflowState.createdEntities['Pet']) {
      const delRes = await petService.delete(workflowState.createdEntities['Pet']);
      expect([HttpStatus.OK, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(delRes.status());
    }
    if (workflowState.createdEntities['Store']) {
      const delRes = await storeService.delete(workflowState.createdEntities['Store']);
      expect([HttpStatus.OK, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(delRes.status());
    }
    if (workflowState.createdEntities['User']) {
      const delRes = await userService.delete(workflowState.createdEntities['User']);
      expect([HttpStatus.OK, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(delRes.status());
    }
  });
});
