import React, { createContext, useContext, useState } from "react";

type AddFolderContextType = {
  addModalVisible: boolean;
  setAddModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const AddFolderContext = createContext<AddFolderContextType | undefined>(
  undefined
);

export function AddFolderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [addModalVisible, setAddModalVisible] = useState(false);

  return (
    <AddFolderContext.Provider
      value={{ addModalVisible, setAddModalVisible }}
    >
      {children}
    </AddFolderContext.Provider>
  );
}

export function useAddFolder() {
  const context = useContext(AddFolderContext);

  if (!context) {
    throw new Error("useAddFolder must be used inside AddFolderProvider");
  }

  return context;
}