import { data_view, UTF8_DECODER, utf8_encode, UTF8_ENCODED_LEN } from './intrinsics.js';
export class ProcBlockV1 {
  addToImports(imports) {
  }
  
  async instantiate(module, imports) {
    imports = imports || {};
    this.addToImports(imports);
    
    if (module instanceof WebAssembly.Instance) {
      this.instance = module;
    } else if (module instanceof WebAssembly.Module) {
      this.instance = await WebAssembly.instantiate(module, imports);
    } else if (module instanceof ArrayBuffer || module instanceof Uint8Array) {
      const { instance } = await WebAssembly.instantiate(module, imports);
      this.instance = instance;
    } else {
      const { instance } = await WebAssembly.instantiateStreaming(module, imports);
      this.instance = instance;
    }
    this._exports = this.instance.exports;
  }
  registerMetadata() {
    this._exports['register-metadata']();
  }
  graph(arg0) {
    const memory = this._exports.memory;
    const realloc = this._exports["canonical_abi_realloc"];
    const free = this._exports["canonical_abi_free"];
    const ptr0 = utf8_encode(arg0, realloc, memory);
    const len0 = UTF8_ENCODED_LEN;
    const ret = this._exports['graph'](ptr0, len0);
    let variant7;
    switch (data_view(memory).getInt32(ret + 0, true)) {
      case 0: {
        variant7 = {
          tag: "ok",
        };
        break;
      }
      case 1: {
        let variant6;
        switch (data_view(memory).getInt32(ret + 8, true)) {
          case 0: {
            const ptr1 = data_view(memory).getInt32(ret + 16, true);
            const len1 = data_view(memory).getInt32(ret + 24, true);
            const list1 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr1, len1));
            free(ptr1, len1, 1);
            variant6 = {
              tag: "other",
              val: list1,
            };
            break;
          }
          case 1: {
            const ptr2 = data_view(memory).getInt32(ret + 16, true);
            const len2 = data_view(memory).getInt32(ret + 24, true);
            const list2 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr2, len2));
            free(ptr2, len2, 1);
            let variant5;
            switch (data_view(memory).getInt32(ret + 32, true)) {
              case 0: {
                const ptr3 = data_view(memory).getInt32(ret + 40, true);
                const len3 = data_view(memory).getInt32(ret + 48, true);
                const list3 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr3, len3));
                free(ptr3, len3, 1);
                variant5 = {
                  tag: "other",
                  val: list3,
                };
                break;
              }
              case 1: {
                variant5 = {
                  tag: "not-found",
                };
                break;
              }
              case 2: {
                const ptr4 = data_view(memory).getInt32(ret + 40, true);
                const len4 = data_view(memory).getInt32(ret + 48, true);
                const list4 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr4, len4));
                free(ptr4, len4, 1);
                variant5 = {
                  tag: "invalid-value",
                  val: list4,
                };
                break;
              }
              default:
              throw new RangeError("invalid variant discriminant for BadArgumentReason");
            }
            variant6 = {
              tag: "invalid-argument",
              val: {
                name: list2,
                reason: variant5,
              },
            };
            break;
          }
          case 2: {
            variant6 = {
              tag: "missing-context",
            };
            break;
          }
          default:
          throw new RangeError("invalid variant discriminant for GraphError");
        }
        variant7 = {
          tag: "err",
          val: variant6,
        };
        break;
      }
      default:
      throw new RangeError("invalid variant discriminant for expected");
    }
    return variant7;
  }
  kernel(arg0) {
    const memory = this._exports.memory;
    const realloc = this._exports["canonical_abi_realloc"];
    const free = this._exports["canonical_abi_free"];
    const ptr0 = utf8_encode(arg0, realloc, memory);
    const len0 = UTF8_ENCODED_LEN;
    const ret = this._exports['kernel'](ptr0, len0);
    let variant11;
    switch (data_view(memory).getInt32(ret + 0, true)) {
      case 0: {
        variant11 = {
          tag: "ok",
        };
        break;
      }
      case 1: {
        let variant10;
        switch (data_view(memory).getInt32(ret + 8, true)) {
          case 0: {
            const ptr1 = data_view(memory).getInt32(ret + 16, true);
            const len1 = data_view(memory).getInt32(ret + 24, true);
            const list1 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr1, len1));
            free(ptr1, len1, 1);
            variant10 = {
              tag: "other",
              val: list1,
            };
            break;
          }
          case 1: {
            const ptr2 = data_view(memory).getInt32(ret + 16, true);
            const len2 = data_view(memory).getInt32(ret + 24, true);
            const list2 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr2, len2));
            free(ptr2, len2, 1);
            let variant5;
            switch (data_view(memory).getInt32(ret + 32, true)) {
              case 0: {
                const ptr3 = data_view(memory).getInt32(ret + 40, true);
                const len3 = data_view(memory).getInt32(ret + 48, true);
                const list3 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr3, len3));
                free(ptr3, len3, 1);
                variant5 = {
                  tag: "other",
                  val: list3,
                };
                break;
              }
              case 1: {
                variant5 = {
                  tag: "not-found",
                };
                break;
              }
              case 2: {
                const ptr4 = data_view(memory).getInt32(ret + 40, true);
                const len4 = data_view(memory).getInt32(ret + 48, true);
                const list4 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr4, len4));
                free(ptr4, len4, 1);
                variant5 = {
                  tag: "invalid-value",
                  val: list4,
                };
                break;
              }
              default:
              throw new RangeError("invalid variant discriminant for BadArgumentReason");
            }
            variant10 = {
              tag: "invalid-argument",
              val: {
                name: list2,
                reason: variant5,
              },
            };
            break;
          }
          case 2: {
            const ptr6 = data_view(memory).getInt32(ret + 16, true);
            const len6 = data_view(memory).getInt32(ret + 24, true);
            const list6 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr6, len6));
            free(ptr6, len6, 1);
            let variant9;
            switch (data_view(memory).getInt32(ret + 32, true)) {
              case 0: {
                const ptr7 = data_view(memory).getInt32(ret + 40, true);
                const len7 = data_view(memory).getInt32(ret + 48, true);
                const list7 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr7, len7));
                free(ptr7, len7, 1);
                variant9 = {
                  tag: "other",
                  val: list7,
                };
                break;
              }
              case 1: {
                variant9 = {
                  tag: "not-found",
                };
                break;
              }
              case 2: {
                const ptr8 = data_view(memory).getInt32(ret + 40, true);
                const len8 = data_view(memory).getInt32(ret + 48, true);
                const list8 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr8, len8));
                free(ptr8, len8, 1);
                variant9 = {
                  tag: "invalid-value",
                  val: list8,
                };
                break;
              }
              case 3: {
                variant9 = {
                  tag: "unsupported-shape",
                };
                break;
              }
              default:
              throw new RangeError("invalid variant discriminant for BadInputReason");
            }
            variant10 = {
              tag: "invalid-input",
              val: {
                name: list6,
                reason: variant9,
              },
            };
            break;
          }
          case 3: {
            variant10 = {
              tag: "missing-context",
            };
            break;
          }
          default:
          throw new RangeError("invalid variant discriminant for KernelError");
        }
        variant11 = {
          tag: "err",
          val: variant10,
        };
        break;
      }
      default:
      throw new RangeError("invalid variant discriminant for expected");
    }
    return variant11;
  }
}
