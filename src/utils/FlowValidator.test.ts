import { isTensorIncompatible1, isTensorIncompatible2, isTensorIncompatible3, isTensorIncompatible4 } from "./FlowValidator";


test('variable length', () => expect(isTensorIncompatible1('Tensor Mismatch', 'Image Normalization source', ['u8', 'i8', 'u16', 'i16', 'u32', 'i32'], "u8")).toBe('no error'));

test('variable length', () => expect(isTensorIncompatible1('Tensor Mismatch', 'Image Normalization source', ['u8', 'i8', 'u16', 'i16', 'u32', 'i32'], "f32")).toBe("Tensor Mismatch Image Normalization source accepts ('u8','i8','u16','i16','u32','i32') types. You provided f32"))

test('variable length', () => {
    expect(isTensorIncompatible2('Tensor Mismatch', 'Food', "u8", "u8", [1, 192, 192, 3], [1, 192, 192, 3])).toBe('no error');
})

test('variable length', () => {
    expect(isTensorIncompatible2('Tensor Mismatch', 'Food', "u8", "u8", [1, 256, 256, 3], [1, 192, 192, 3])).toBe('Tensor Mismatch Food accepts u8 types with these EXACT! dimensions [1,192,192,3]. You provided u8 type with [1,256,256,3]');
})

//inception -> most-confident-indices
test('variable length', () => {
    expect(isTensorIncompatible3('Tensor Mismatch', 'Label source', "u8", "u8", [1, 1001], [0], "fixed")).toBe('Tensor Mismatch Label source accepts 1-D tensor. You provided 2-D tensor with shape [1,1001]');
})

test('variable length', () => {
    expect(isTensorIncompatible3('Tensor Mismatch', 'Label source', "u8", "u8", [1, 1, 1, 3], [0], "fixed")).toBe('Tensor Mismatch Label source accepts 1-D tensor. You provided 4-D tensor with shape [1,1,1,3]')
})

test('variable length', () => {
    expect(isTensorIncompatible3('Tensor Mismatch', 'Normalize source', "u8", "u8", [1, 1, 1, 3], [0], "dynamic")).toBe('no error')
})

test('variable length', () => {
    expect(isTensorIncompatible3('Tensor Mismatch', 'Normalize source', "u8", "u8", [1, 1, 1, 3], [0], "dynamic")).toBe('no error')
})

test('variable length', () => {
    expect(isTensorIncompatible3('Tensor Mismatch', 'Inception', "f32", "u8", [1, 0, 0, 0], [1, 299, 299], "fixed")).toBe('Tensor Mismatch Inception accepts 3-D tensor. You provided 4-D tensor with shape [1,0,0,0]')
})

test('variable length', () => {
    expect(isTensorIncompatible4('Tensor Mismatch', 'Normalize source', "u8", "u8", [1, 1, 3], [1, 0, 0], "dynamic")).toBe('no error')
})

test('variable length', () => {
    expect(isTensorIncompatible4('Tensor Mismatch', 'Normalize source', "u8", "u8", [1, 1, 3], [1, 0, 0], "fixed")).toBe('no error')
})

test('variable length', () => {
    expect(isTensorIncompatible4('Tensor Mismatch', 'Normalize source', "u8", "u8", [1, 1, 3], [1, 1, 2], "fixed")).toBe('Tensor Mismatch Normalize source accepts u8 types with [1,1,2]. You provided u8 type with [1,1,3]')
})
