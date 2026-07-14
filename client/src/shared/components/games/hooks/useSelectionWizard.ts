import { useCallback, useEffect, useState } from "react";
import { BASE_URL

 } from "@/shared/config/api";

 export interface Folder {
    id: string;
    subject : string;
    accentColor : string;
    cardCount: number;
 }

export function useSelectionWizard(){
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(false);


    const fetchFolders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/folders`);

            if (!response.ok) {
                throw new Error("cannot fetch folders");
            }
            const data = await response.json(); 
            setFolders(data.response);

        } catch (error) {
            console.error(error);
        }finally{
            setLoading(false);
        }
    },[]);

    useEffect(() => {
        fetchFolders();
    },[]);

    return{
        loading, 
        folders,
        fetchFolders,
    }
}