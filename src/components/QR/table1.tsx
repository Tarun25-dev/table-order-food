import QRCode from "qrcode";
import { useEffect, useState } from "react";

export default function Table(){
    const [qrCode, setQrCode] = useState("");
    const tableId = "T3";

    useEffect(() => {
        const generateQR = async () => {
            const url = `${window.location.origin}/table/${tableId}`;
            const qr = await QRCode.toDataURL(url);
            setQrCode(qr);
        }
        generateQR();
    }, []);

    return(
        <div>
            {qrCode && (
                <img src={qrCode} className="h-48 w-48"/>
            )}
            <p>Table {tableId}</p>
        </div>
    )
}