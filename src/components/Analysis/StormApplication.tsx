// Note: eslint seems to get confused because StormApplication contains both
// getters and methods called "getXXX()". Regardless of how you order members
// it'll keep complaining about "@typescript-eslint/member-ordering", so....
/* eslint-disable @typescript-eslint/member-ordering */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import * as SRD from "@projectstorm/react-diagrams";
import createEngine, {
  RightAngleLinkFactory,
  DefaultDiagramState,
  PortModel
} from "@projectstorm/react-diagrams";
// import { BaseEntityEvent } from "@projectstorm/react-canvas-core";
import { Component, Model, Output } from "./model";
import { ForgeNodeFactory } from "./model/ForgeNodeFactory";
import { ForgeNodePortFactory } from "./model/ForgeNodePortFactory";
import {
  DiagramLayer,
  LayerModels,
  ResourceDeclaration,
  SerializedComponent,
  SerializedDiagram
} from "./model/Storm";

export class StormApplication {
  public constructor(
    engine: SRD.DiagramEngine,
    componentRegistry: () => Record<string, Component | undefined>
  ) {
    this._diagramEngine = engine;
    this.componentRegistry = componentRegistry;
    this._activeModel = new SRD.DiagramModel();
    this._diagramEngine.setModel(this._activeModel);
  }

  /**
   * Convenience function to construct a StormApplication with a Forge-specific
   * engine.
   */
  public static create(
    componentRegistry: () => Record<string, Component | undefined>
  ): StormApplication {
    const engine = createEngine();

    engine
      .getNodeFactories()
      .registerFactory(new ForgeNodeFactory("capability", componentRegistry));
    engine
      .getNodeFactories()
      .registerFactory(new ForgeNodeFactory("model", componentRegistry));
    engine
      .getNodeFactories()
      .registerFactory(new ForgeNodeFactory("proc-block", componentRegistry));
    engine
      .getNodeFactories()
      .registerFactory(new ForgeNodeFactory("output", componentRegistry));
    engine.getLinkFactories().registerFactory(new RightAngleLinkFactory());
    engine
      .getPortFactories()
      .registerFactory(new ForgeNodePortFactory("default"));
    const application = new StormApplication(engine, componentRegistry);

    const state = engine.getStateMachine().getCurrentState();
    if (state instanceof DefaultDiagramState) {
      state.dragNewLink.config.allowLooseLinks = false;
    }

    // FIXME: Update the listener generics so we have the correct event type here
    application.activeModel.registerListener({
      nodesUpdated: (event: any) => {
        application.activeModel.clearSelection();
        if (event.isCreated) {
          event.node.setSelected(true);
        }
      }
    });

    application.activeModel.registerListener({
      entityRemoved: (event: any) => {
        event.stopPropagation();
      }
    });

    return application;
  }

  public get diagramEngine(): SRD.DiagramEngine {
    return this._diagramEngine;
  }

  public set diagramEngine(diagramEngine: SRD.DiagramEngine) {
    this._diagramEngine = diagramEngine;
    this._diagramEngine.setModel(this._activeModel);
  }

  public get activeModel(): SRD.DiagramModel {
    return this._activeModel;
  }

  public set activeModel(diagramModel: SRD.DiagramModel) {
    this._activeModel = diagramModel;
    this._diagramEngine.setModel(this._activeModel);
  }

  public serialize(): SerializedDiagram {
    this.activeModel.clearSelection();
    const serialized = this.activeModel.serialize() as SerializedDiagram;
    if (serialized.layers.length > 1 && serialized.layers[1].models)
      for (const [key, value] of Object.entries(
        serialized.layers[1].models as LayerModels
      )) {
        if (value && value.componentID && value.componentID.endsWith("label"))
          if (value.propertiesValueMap != undefined) {
            value.propertiesValueMap[
              "wordlist"
            ] = `$resource_${this.sanitizeResourceNames(key)}`;
            serialized.layers[1].models[key].propertiesValueMap =
              value.propertiesValueMap;
          }
      }
    return {
      ...serialized,
      customComponents: this.customComponents(),
      resources: this.resources()
    };
  }

  /**
   * Deserialize the diagram.
   *
   * Note: You will need to add any custom components to the component registry
   * before calling this.
   */
  public deserialize(diagram: SerializedDiagram) {
    this.activeModel.deserializeModel(diagram, this.diagramEngine);
  }

  public getDiagramEngine(): SRD.DiagramEngine {
    return this.diagramEngine;
  }

  private customComponents(): Record<string, SerializedComponent> {
    const components = this.componentRegistry();
    const serializable: Record<string, SerializedComponent> = {};

    for (const [key, value] of Object.entries(components)) {
      if (
        value &&
        value.source === "custom" &&
        (value.type === "output" || value.type === "model")
      ) {
        serializable[key] = value;
      }
    }

    return serializable;
  }

  private resources(): Record<string, ResourceDeclaration> {
    const resources: Record<string, ResourceDeclaration> = {};
    const layers = this.activeModel.serialize().layers as DiagramLayer[];
    if (layers.length > 1 && layers[1].models)
      for (const [, value] of Object.entries(layers[1].models)) {
        if (value && value.componentID && value.componentID.endsWith("label"))
          resources[`resource_${this.sanitizeResourceNames(value.id)}`] = {
            path: `./${this.sanitizeResourceNames(value.id)}`,
            type: "string"
          };
      }
    return resources;
  }

  private sanitizeResourceNames(resourceName: string): string {
    return resourceName.replace(/\-/g, "");
  }

  protected _activeModel: SRD.DiagramModel;
  protected _diagramEngine: SRD.DiagramEngine;
  protected componentRegistry: () => Record<string, Component | undefined>;
}
