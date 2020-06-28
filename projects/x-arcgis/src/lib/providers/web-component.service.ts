import { timer } from 'rxjs';
import { take } from 'rxjs/operators';

import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Injector, OnDestroy, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { MatIcon } from '@angular/material/icon';

import { IWebComponents } from '../model';
import { SidenavService } from './sidenav.service';

import esri = __esri;

type CloseEventHandler = (view: esri.MapView, editor: esri.Editor) => (event: MouseEvent) => void;

@Injectable({ providedIn: 'root' })
export class WebComponentService implements OnDestroy {
  /**
   * By default, we add a span element to the editor popup in order to exit the draw process
   */
  private closeNodeTagName = 'span';

  private webComponents: IWebComponents[] = [];

  private closeIconListener: (event: MouseEvent) => void;

  private unbindIconListener: (event: MouseEvent) => void;

  constructor(
    private injector: Injector,
    private sidenavService: SidenavService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.defineCustomElements();
  }

  /**
   * set the html element that use for close the draw modal;
   * component: The component that will display in to editor popup, used to exit the draw process;
   */
  setCloseNode(
    // tslint: disable-next-line: no-any;
    component: Type<any>,
    closeEventHandler: CloseEventHandler,
    closeNodeTagName = 'close-element'
  ): void {
    const CloseElement = createCustomElement(component, { injector: this.injector });

    customElements.define(closeNodeTagName, CloseElement);

    const node = this.document.createElement(closeNodeTagName);

    this.closeNodeTagName = closeNodeTagName;
    this.webComponents.push({ tagName: closeNodeTagName, node, listener: closeEventHandler });
  }

  addCloseElement(
    view: esri.MapView,
    editor: esri.Editor,
    defaultListener: (view: esri.MapView, editor: esri.Editor) => void
  ) {
    timer(1000, 0)
      .pipe(take(1))
      .subscribe((_) => {
        const header = this.document.querySelector('.esri-editor__header');

        if (!header) {
          return;
        }

        const appended = header.querySelector(this.closeNodeTagName);
        let node = null;

        if (!!appended) {
          return;
        }

        if (this.closeNodeTagName === 'span') {
          node = this.document.createElement(this.closeNodeTagName);
          node.innerText = '退出';
          node.className = 'close-editor';
          node.style.cssText = 'cursor:pointer;';
          node.setAttribute('title', '退出编辑');
          this.closeIconListener && node.removeEventListener('click', this.closeIconListener);
          this.closeIconListener = () => defaultListener(view, editor);
          node.addEventListener('click', this.closeIconListener);
          this.webComponents.push({ tagName: this.closeNodeTagName, node, listener: defaultListener });
        } else {
          const index = this.webComponents.findIndex((item) => (item.tagName = this.closeNodeTagName));
          const { tagName, listener, node: closeNode } = this.webComponents[index];
          node = closeNode;
          // the node element only created once, so we must remove the listener first;
          this.closeIconListener && node.removeEventListener('click', this.closeIconListener);
          // create a new event listener
          this.closeIconListener = listener(view, editor);
          node.addEventListener('click', this.closeIconListener);
          this.webComponents[index] = { tagName, node, listener };
        }

        node.id = 'x-arcgis-close-editor-icon';
        header.appendChild(node);
      });
  }

  addUnbindElement(boundNodeId: number): void {
    timer(1000, 0)
      .pipe(take(1))
      .subscribe((_) => {
        const boundNameControl = this.document.querySelector('.esri-feature-form__label');

        if (!boundNameControl) {
          return;
        }

        const appended = boundNameControl.querySelector('mat-icon');
        let node = null;

        if (!!appended) {
          return;
        }

        /**
         * unbind icon has two state:
         * 1. unbind - in this state we need to send the unbind action to linkObs
         * 2. reset - in this state we need cancel unbinding.
         */
        const unbindNode = this.document.createElement('mat-icon');

        unbindNode.innerText = 'link_off';
        unbindNode['color'] = 'warn';
        unbindNode.title = '解绑当前节点';

        const listener = (nodeId: number) => (event: MouseEvent) => {
          this.sidenavService.linkNode$.next({ node: this.sidenavService.getNodeById(nodeId), action: 'unbind' });
        };

        node = unbindNode;
        this.unbindIconListener && node.removeEventListener('click', this.unbindIconListener);
        // create a new event listener
        this.unbindIconListener = listener(boundNodeId);
        node.addEventListener('click', this.unbindIconListener);

        node.id = 'x-arcgis-unbind-node-icon';
        boundNameControl.appendChild(node);
      });
  }

  private defineCustomElements(): void {
    const unbindEle = createCustomElement(MatIcon, { injector: this.injector });

    customElements.define('mat-icon', unbindEle);
  }

  /**
   * Release source before service destroy;
   */
  ngOnDestroy() {
    this.webComponents.forEach((item) => {
      item.node.removeEventListener('click', item.listener);
    });

    this.webComponents = null;
  }
}
