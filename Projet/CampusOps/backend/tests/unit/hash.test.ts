import { hashPassword, comparePassword } from '../../src/utils/hash';

describe('utils/hash', () => {
    it('produces a bcrypt-shaped hash', async () => {
        const hash = await hashPassword('s3cret!');
        expect(hash).toMatch(/^\$2[aby]\$/);
        expect(hash).not.toContain('s3cret');
    });

    it('verifies a correct password', async () => {
        const hash = await hashPassword('correct horse battery staple');
        await expect(comparePassword('correct horse battery staple', hash)).resolves.toBe(true);
    });

    it('rejects an incorrect password', async () => {
        const hash = await hashPassword('Pa$$w0rd');
        await expect(comparePassword('wrong', hash)).resolves.toBe(false);
    });

    it('produces a different hash each time (salted)', async () => {
        const h1 = await hashPassword('same-input');
        const h2 = await hashPassword('same-input');
        expect(h1).not.toBe(h2);
    });
});
