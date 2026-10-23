import React from 'react';
import { FoodItem } from '../types/nutrition';
import { ProductEditor } from './ProductEditor';

interface CustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFood: (food: Omit<FoodItem, 'id' | 'isCustom'>) => Promise<boolean>;
}

export const CustomFoodModal: React.FC<CustomFoodModalProps> = ({
  isOpen,
  onClose,
  onSaveFood,
}) => {
  if (!isOpen) return null;
  return <ProductEditor onClose={onClose} onSave={onSaveFood} />;
};
