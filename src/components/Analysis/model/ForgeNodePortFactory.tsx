import { DiagramEngine } from '@projectstorm/react-diagrams';
import { AbstractModelFactory, GenerateModelEvent } from '@projectstorm/react-canvas-core';
import ForgeNodePort, { ForgeNodePortOptions } from './ForgeNodePort';

interface GenerateForgeNodeModelEvent extends GenerateModelEvent {
	initialConfig?: ForgeNodePortOptions;
}

export class ForgeNodePortFactory extends AbstractModelFactory<ForgeNodePort, DiagramEngine> {
	public generateModel(event: GenerateForgeNodeModelEvent): ForgeNodePort {
		if (!event.initialConfig) {
			// we need to construct a dummy instance that will be populated
			// by the deserialize() method
			return new ForgeNodePort({ idx: -1, label: "", name: "", tensor: { dimensions: [], elementType: "u8" } });
		}

		return new ForgeNodePort(event.initialConfig);
	}
}
