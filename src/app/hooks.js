import { useDispatch, useSelector } from 'react-redux';

/**
 * Thin re-exports. In a TS codebase these would carry the store types;
 * here they just give every feature one consistent import path.
 */
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
