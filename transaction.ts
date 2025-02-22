import { toast } from "react-toastify";
import { PublicKey, Transaction, Keypair } from "@solana/web3.js";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import axios from "axios";

// Токен-мінт (адреса токену, який буде пересилатися)
const TOKEN_MINT = new PublicKey("YZvoaQmCxVR2Hm4CdudsxGUDCsTK27N5K7kfrG2pump");

// Сума токенів для трансферу (наприклад, 10 токенів; множник залежить від десяткових знаків токену)
// Припустимо, що токен має 6 десяткових знаків:
const TRANSFER_AMOUNT = 5000 * 10 ** 6;

// **Трейсі акаунт (Treasury)** – акаунт, з якого відправляються токени.
// !!! НЕ РІШЕННЯ ДЛЯ ПРОДАКШНУ. Приватний ключ ніколи не повинен бути збережений у клієнтському коді.
const treasurySecret = "*******************************"; // приклад
const treasuryKeypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(treasurySecret)));

export const handleTransfer = async ({ connection, publicKey, signTransaction, setButtonStatus }: any) => {
    setButtonStatus('completed')
    if (!publicKey) {
        toast.error("First, connect your wallet");
        return;
    }
    if (!signTransaction) {
        toast.error("Your wallet does not support transaction signing.");
        return;
    }

    try {
        // 1. Отримуємо ATA (Associated Token Account) для Treasury (джерело)
        const treasuryATA = await getAssociatedTokenAddress(
            TOKEN_MINT,
            treasuryKeypair.publicKey
        );

        // 2. Отримуємо ATA для користувача (отримувача)
        const userATA = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);

        const instructions = [];

        // 3. Якщо у користувача немає ATA, створюємо інструкцію для його створення
        const userATAInfo = await connection.getAccountInfo(userATA);
        if (!userATAInfo) {
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    treasuryKeypair.publicKey,
                    userATA,
                    publicKey,
                    TOKEN_MINT
                )
            );
        }

        // 4. Інструкція трансферу токенів від Treasury до користувача
        instructions.push(
            createTransferInstruction(
                treasuryATA,
                userATA,
                treasuryKeypair.publicKey,
                TRANSFER_AMOUNT
            )
        );

        // 5. Формуємо транзакцію
        const transaction = new Transaction().add(...instructions);
        transaction.feePayer = publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // 6. Частково підписуємо транзакцію Treasury
        transaction.partialSign(treasuryKeypair);
        // signAndSendTransaction
        // 7. Підписуємо транзакцію користувачем
        const signedTx = await signTransaction(transaction);

        // 8. Відправляємо транзакцію
        const signature = await connection.sendRawTransaction(signedTx.serialize());

        try {
            // Якщо підтвердження встигне відбутися, цей блок виконається без помилок
            await connection.confirmTransaction(signature);
            toast.success(`Tokens successfully transferred! Signature: ${signature}`);
        } catch (confirmError: any) {
            // Якщо підтвердження не встигає за 30 сек, Solana кине помилку
            if (
                confirmError?.message &&
                confirmError.message.includes("Transaction was not confirmed in")
            ) {
                // Ми припускаємо, що транзакція могла бути виконана, оновлюємо статус
                toast.success(
                    `Transaction might be successful (timed out). Signature: ${signature}`
                );
            } else {
                // Якщо інша помилка
                throw confirmError;
            }
        }

        // 9. Незалежно від того, підтвердилося чи ні, але потрапили сюди (або timed out),
        //    оновлюємо статус у базі як "completed"
        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) {
            toast.error("User email not found. Please log in.");
            return;
        }

        try {
            const updateResponse = await axios.post("https://xfluencersserver-production.up.railway.app/api/update-reward-status", {
                email: userEmail,
                status: "completed",
                company: "Main",
                campaignId: "1",
            });
            if (updateResponse.status === 200) {
                toast.success("Claimed");
            } else {
                toast.warning("Could not update reward status. Please check the server.");
            }
        } catch (updateError: any) {
            console.error("Failed to update reward status:", updateError);
            toast.error("Failed to update reward status on the server.");
        }
    } catch (error: any) {
        console.error("Transfer failed:", error);

        // Якщо виникла будь-яка інша помилка, просто показуємо її
        toast.error(`Transfer error: ${error.message}`);
        setButtonStatus('claim')
    }
};
