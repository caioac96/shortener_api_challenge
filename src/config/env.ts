function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing env: ${name}. Please verify`);
    return value;
}

export const env = {
    DB_HOST: required('DATABASE_HOST'),
    DB_PORT: Number(required('DATABASE_PORT')),
    DB_USER: required('DATABASE_USER'),
    DB_PASSWORD: required('DATABASE_PASSWORD'),
    DB_NAME: required('DATABASE_NAME'),
    JWT_SECRET: required('JWT_SECRET'),
};
