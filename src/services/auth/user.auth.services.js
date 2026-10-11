import {PrismaClient} from '@prisma/client'
import {comparePassword, hashPassword} from "../../helper/helper.js";


const prisma = new PrismaClient();

async function userExistence(json) {
    try {
        const user = await prisma.user.findUnique({
            where: {phoneNumber: json.phoneNumber, email: json.email}
        })
        if (user) return {error: 'user already exists'};
        return json
    } catch (error) {
        console.log(error)
    }
}

export async function signUp(json) {
    try {
        const doesUserExist = await userExistence(json);
        if (doesUserExist.error) {
            throw new Error("User already exists");
        } else {
            const hashedPassword = await hashPassword(json.password);
            return await prisma.user.create({
                data: {
                    userName: json.userName,
                    password: hashedPassword,
                    phoneNumber: json.phoneNumber,
                    email: json.email,
                }
            });
        }
    } catch (error) {
        console.error(error)
        return {error: error.message};
    }
}

export async function login(json) {
    try {
        const user = await prisma.user.findUnique({
            where: {phoneNumber: json.phoneNumber},
        })
        if (!user) {
            throw new Error("user does not exist");
        }
        else if ((json.userName !== user.userName) || (!comparePassword(json.password, user.password))){
            throw new Error("invaild username or password")
        }

        return user;
    } catch (error) {
        console.error(error)
        return {error: error.message};
    }
}