const request = require('supertest');
const app = require('../app'); // agora importa só o app

describe('API Tests', () => {
    it('GET / should return welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('Welcome');
    });

    it('GET /health should return ok', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('POST /sum should return result', async () => {
        const res = await request(app)
            .post('/sum')
            .send({ a: 3, b: 4 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ result: 7 });
    });

    it('POST /sum should return 400 if one of the values is missing', async () => {
        const res = await request(app)
            .post('/sum')
            .send({ a: 10 }); // faltando 'b'
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('GET /unknown should return 404', async () => {
        const res = await request(app).get('/unknown');
        expect(res.statusCode).toBe(404);
    });
});