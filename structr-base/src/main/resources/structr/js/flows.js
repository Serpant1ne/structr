/*
 * Copyright (C) 2010-2022 Structr GmbH
 *
 * This file is part of Structr <http://structr.org>.
 *
 * Structr is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Structr is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Structr.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Persistence }         from "./lib/structr/persistence/Persistence.js";
import { FlowContainer }       from "./flow-editor/src/js/editor/entities/FlowContainer.js";
import { FlowEditor }          from "./flow-editor/src/js/editor/FlowEditor.js";
import { LayoutModal }         from "./flow-editor/src/js/editor/utility/LayoutModal.js";
import { Rest }                from "./lib/structr/rest/Rest.js";

let flowsMain, flowsTree, flowsCanvas, nodeEditor;
let flowEditor, flowId;
const methodPageSize = 10000, methodPage = 1;

document.addEventListener("DOMContentLoaded", function() {
	Structr.registerModule(_Flows);
});

let _Flows = {
	_moduleName: 'flows',
	flowsResizerLeftKey: 'structrFlowsResizerLeftKey_' + location.port,
	init: function() {

		Structr.makePagesMenuDroppable();
		Structr.adaptUiToAvailableFeatures();

		window.addEventListener('resize', _Flows.resize);
	},
	resize: () => {
		Structr.resize(() => {
			_Flows.moveResizer();
		});
	},
	dialogSizeChanged: () => {
		_Editors.resizeVisibleEditors();
	},
	moveResizer: (left) => {
		left = left || LSWrapper.getItem(_Flows.flowsResizerLeftKey) || 300;
		flowsMain.querySelector('.column-resizer').style.left = left + 'px';
		flowsTree.style.width   = left - 14 + 'px';
		if (nodeEditor) nodeEditor.style.width = '100%';
	},
	onload: () => {

		async function getOrCreateFlowPackage(packageArray) {

			if (packageArray !== null && packageArray.length > 0) {

				let currentPackage = packageArray[packageArray.length-1];
				packageArray.pop();

				let result = await persistence.getNodesByName(currentPackage, {type:"FlowContainerPackage"});

				if (result != null && result.length > 0 && result[0].effectiveName === (packageArray.join('.') + '.' + currentPackage)) {

					result = result[0];
				} else {

					result = await persistence.createNode({type: "FlowContainerPackage", name: currentPackage});
				}

				if (packageArray.length > 0) {
					result.parent = await getOrCreateFlowPackage(packageArray);
				}

				return result;
			}

			return null;
		}

		async function createFlow(inputElement) {
			let name = inputElement.value;
			inputElement.value = "";

			let parentPackage = null;

			if (name.indexOf(".") !== -1) {
				let nameElements = name.split(".");
				name = nameElements[nameElements.length -1];
				nameElements.pop();

				parentPackage = await getOrCreateFlowPackage(nameElements);
			}

			let flowObject = {
				type: "FlowContainer",
				name: name
			};

			if (parentPackage !== null) {
				flowObject.flowPackage = parentPackage.id;
			}

			persistence.createNode(flowObject).then( (r) => {
				if (r !== null && r !== undefined && r.id !== null && r.id !== undefined) {
					_Flows.refreshTree(() => {
						$(flowsTree).jstree("deselect_all");
						$(flowsTree).jstree(true).select_node('li[id=\"' + r.id + '\"]');
					});
				}
			});
		}

		function deleteFlow(id) {

			if (!document.querySelector(".delete_flow_icon").getAttribute('class').includes('disabled')) {
				Structr.confirmation('Really delete flow ' + id + '?', () => {
					persistence.deleteNode({type:"FlowContainer", id: flowId}).then(() => {
						_Flows.refreshTree();

						$.unblockUI({
							fadeOut: 25
						});
					});
				});
			}
		}

		async function getPackageByEffectiveName(name) {
			let nameComponents = name.split("/");
			nameComponents = nameComponents.slice(1, nameComponents.length);
			let packages = await rest.get(Structr.getPrefixedRootUrl('/structr/rest/FlowContainerPackage?effectiveName=' + encodeURIComponent(nameComponents.join("."))));
			return packages.result.length > 0 ? packages.result[0] : null;
		}

		let rest = new Rest();
		let persistence = new Persistence();

		Structr.mainContainer.innerHTML = _Flows.templates.main();
		Structr.functionBar.innerHTML = _Flows.templates.functions();

		UISettings.showSettingsForCurrentModule();

		document.querySelector('#name-input').onkeydown = ((event) => {
			if (event.key === "Enter") {
				createFlow(document.getElementById('name-input'));
			}
		});
		document.querySelector('#create-new-flow').onclick = () => createFlow(document.getElementById('name-input'));
		document.querySelector('.reset_view_icon').onclick = () => flowEditor.resetView();

		let focusSelect = document.querySelector('#flow-focus-select');
		focusSelect.onchange = () => {

			let focus = focusSelect.value;

			flowsCanvas.classList.remove('focus');
			flowsCanvas.classList.remove('focus-action');
			flowsCanvas.classList.remove('focus-data');
			flowsCanvas.classList.remove('focus-exception');
			flowsCanvas.classList.remove('focus-logic');

			if (focus !== 'none') {
				flowsCanvas.classList.add('focus');
				flowsCanvas.classList.add('focus-' + focus);
			}
		};

		document.querySelector('.delete_flow_icon').onclick = () => deleteFlow(flowId);
		document.querySelector('.layout_icon').onclick = function() {
			if (!this.getAttribute('class').includes('disabled')) {
				new LayoutModal(flowEditor);
			}
		};

		document.querySelector('.run_flow_icon').addEventListener('click', function() {
			if (!this.getAttribute('class').includes('disabled')) {
				flowEditor.executeFlow();
			}
		});

		_Flows.init();

		Structr.updateMainHelpLink(Structr.getDocumentationURLForTopic('flows'));

		flowsMain   = document.querySelector('#flows-main');
		flowsTree   = document.querySelector('#flows-tree');
		flowsCanvas = document.querySelector('#flows-canvas');

		_Flows.moveResizer();
		Structr.initVerticalSlider(document.querySelector('#flows-main .column-resizer'), _Flows.flowsResizerLeftKey, 204, _Flows.moveResizer);

		$(flowsTree).jstree({
			plugins: ["themes", "dnd", "search", "state", "types", "wholerow", "sort", "contextmenu"],
			core: {
				check_callback: true,
				animation: 0,
				state: {
					key: 'structr-ui-flows'
				},
				async: true,
				data: _Flows.treeInitFunction,
			},
			sort: function(a, b) {
				let a1 = this.get_node(a);
				let b1 = this.get_node(b);

				if (a1.id.startsWith('/') && !b1.id.startsWith('/')) {
					return -1;
				} else if (b1.id.startsWith('/') && !a1.id.startsWith('/')) {
					return 1;
				} else {
					return (a1.text > b1.text) ? 1 : -1;
				}
			},
			contextmenu: {
				items: function(node) {
					let menuItems = {};

					if (node.data === null || node.id === "root") {

						menuItems.addFlow = {
							label: "Add Flow",
							action: async function (node) {
								let ref = $.jstree.reference(node.reference);
								let sel = ref.get_selected();
								if(!sel.length) { return false; }

								let p = null;
								if (sel[0] !== "root") {
									p = await getPackageByEffectiveName(sel[0]);
								}

								let newFlow = await persistence.createNode({
									type: "FlowContainer",
									flowPackage: p !== null ? p.id : null
								});
								newFlow.name = 'NewFlow-' + newFlow.id;

								newFlow = (await persistence.getNodesById(newFlow.id, {type: "FlowContainer"}))[0];
								_Flows.refreshTree(() => {
									$(flowsTree).jstree("deselect_all");
									$(flowsTree).jstree(true).select_node('li[id=\"' + newFlow.id + '\"]');
									_Flows.initFlow(newFlow.id);
								});

							}
						};
						menuItems.addPackage = {
							label: "Add Package",
							action: async function (node) {
								let ref = $.jstree.reference(node.reference);
								let sel = ref.get_selected();
								if(!sel.length) { return false; }

								let p = null;
								if (sel[0] !== "root") {
									p = await getPackageByEffectiveName(sel[0]);
								}

								let newFlowPackage = await persistence.createNode({
									type: "FlowContainerPackage",
									parent: p !== null ? p.id : null
								});
								newFlowPackage.name = 'NewFlowPackage-' + newFlowPackage.id;

								newFlowPackage = await persistence.getNodesById(newFlowPackage.id, {type: "FlowContainerPackage"});
								_Flows.refreshTree(() => {
									$(flowsTree).jstree("deselect_all");
									$(flowsTree).jstree(true).select_node('li[id=\"' + newFlowPackage.id + '\"]');
								});
							}
						};
					}

					if (node.id !== 'root' && node.id !== 'globals') {
						menuItems.renameItem = {
							label: "Rename",
							action: function(node) {
								let ref = $.jstree.reference(node.reference);
								let sel = ref.get_selected();
								if(!sel.length) { return false; }
								sel = sel[0];
								if(sel) {
									ref.edit(sel);
								}
							}
						};
						menuItems.deleteItem = {
							label: "Delete",
							action: function(node) {
								let ref = $.jstree.reference(node.reference);
								let sel = ref.get_selected();
								if(!sel.length) { return false; }
								sel = sel[0];
								if(sel) {
									let deleteMsg = null;
									if (ref._model.data[sel].data !== null && ref._model.data[sel].data.type === "FlowContainer") {
										deleteMsg = "Delete flow?";
									}  else {
										deleteMsg = "Delete recurively?";
									}
									if (confirm(deleteMsg)) {
										ref.delete_node(sel);
									}
								}
							}
						};
					}

					return menuItems;
				}
			}
		});

		_TreeHelper.addSvgIconReplacementBehaviorToTree($(flowsTree));

		Structr.unblockMenu(100);

		_Flows.resize();

		$(flowsTree).on('select_node.jstree', function(a, b) {

			if (b.event && b.event.type === "contextmenu") {
				return;
			}

			let id = $(flowsTree).jstree('get_selected')[0];
			if (id && b.node.data !== null && b.node.data.type === 'FlowContainer') {
				_Flows.initFlow(id);
			}
		});

		$(flowsTree).on('delete_node.jstree', function(event, data) {

			let handleDeletion = async function() {

				let type = data.node.data !== null && data.node.data.type !== null ? data.node.data.type : "FlowContainerPackage";
				let id = type === "FlowContainer" ? data.node.id : null;

				if (id === null && type === "FlowContainerPackage") {
					let p = await getPackageByEffectiveName(data.node.id);
					id = p.id;
				}

				if (id !== null) {
					persistence.deleteNode({
						type: type,
						id: id
					});
				}

				if (flowEditor !== undefined && flowEditor !== null && flowEditor.cleanup !== undefined) {
					flowEditor.cleanup();
					flowEditor = undefined;
				}

				// display flow canvas
				flowsCanvas.innerHTML = '<div id="nodeEditor" class="node-editor"></div>';
			};

			handleDeletion();
		});

		$(flowsTree).on('rename_node.jstree', function(event, data) {

			let handleRename = async function() {

				let type = data.node.data !== null && data.node.data.type !== null ? data.node.data.type : "FlowContainerPackage";
				let id = type === "FlowContainer" ? data.node.id : null;
				let name = data.text;

				if (id === null && type === "FlowContainerPackage") {
					let p = await getPackageByEffectiveName(data.node.id);
					if (p !== null) {
						id = p.id;
					}
				}

				let dataObject = {
					type: type,
					id: id,
					scheduledForIndexing: true
				};

				if (name.indexOf(".") !== -1) {
					dataObject.effectiveName = name;
				} else {
					dataObject.name = name;
				}

				if (id !== null) {
					await persistence._persistObject(dataObject);

					_Flows.refreshTree(() => {});
				}

			};

			handleRename();
		});

		$(flowsTree).on('move_node.jstree', function(event, data) {

			let handleParentChange = async function() {

				let type = data.node.data !== null && data.node.data.type !== null ? data.node.data.type : "FlowContainerPackage";
				let parent = data.node.parent;
				let id = type === "FlowContainer" ? data.node.id : null;

				let persistNode = async function(node) {
					persistence._persistObject(node);
				};

				if (id === null && type === "FlowContainerPackage") {
					let p = await getPackageByEffectiveName(data.node.id);
					id = p.id;
				}

				let parentId = null;

				if (parent !== "root") {
					let p = await getPackageByEffectiveName(parent);
					parentId = p.id;
				}

				let objectData = {
					type: type,
					id: id,
					scheduledForIndexing: true
				};

				let parentKey = null;
				switch (type) {
					case "FlowContainer":
						parentKey = "flowPackage";
						break;
					case "FlowContainerPackage":
						parentKey = "parent";
						break;
				}

				if (parentKey != null) {
					objectData[parentKey] = parentId;
					await persistNode(objectData);
				}

			};

			handleParentChange();
		});

		document.addEventListener("floweditor.nodescriptclick", event => {
			_Flows.openEditor(event.detail);
		});

		document.addEventListener("floweditor.loadflow", event => {
			if (event.detail.id !== undefined && event.detail.id !== null) {
				$(flowsTree).jstree("deselect_all");
				$(flowsTree).jstree(true).select_node('li[id=\"' + event.detail.id + '\"]');
			}
		});
	},
	refreshTree: (callback) => {
		_TreeHelper.refreshTree(flowsTree, callback);
	},
	treeInitFunction: (obj, callback) => {

		switch (obj.id) {

			case '#':

				let defaultEntries = [
					{
						id: 'root',
						text: 'Flows',
						children: true,
						icon: _Icons.jstree_fake_icon,
						data: { type: "root", svgIcon: _Icons.getSvgIcon('structr-s-small', 18, 24) },
						path: '/',
						state: {
							opened: true,
							selected: true
						}
					}
				];

				callback(defaultEntries);
				break;

			case 'root':
				_Flows.load(null, callback);
				break;

			default:
				_Flows.load(obj.id, callback);
				break;
		}

	},
	unload: () => {
		window.removeEventListener('resize', _Flows.resize);
		fastRemoveAllChildren(document.querySelector('#main .searchBox'));
		fastRemoveAllChildren(document.querySelector('#main #flows-main'));
	},
	load: (id, callback) => {

		let list = [];

		let createFlowEntry = function(d) {

			return {
				id: d.id,
				text: d.name ? d.name.split('.').pop() : '[unnamed]',
				children: false,
				icon: _Icons.jstree_fake_icon,
				data: {
					type: d.type,
					svgIcon: _Icons.getSvgIcon('circle-empty', 16, 24, _Icons.getSvgIconClassesForColoredIcon(['icon-blue']))
				}
			};
		};

		let createFolder = function(path, list) {
			// Consume path to navigate to logical root in list
			let listRoot = list;
			let traversedPath = [];
			for (let p of path) {
				traversedPath.push(p);
				let currentFolder = listRoot.filter( r => r.id === ('/' + traversedPath.join('/')) );
				if (currentFolder.length >= 1) {
					listRoot = currentFolder[0].children;
				} else {
					let newFolder = {
						id: ('/' + traversedPath.join('/')),
						text: p,
						icon: _Icons.jstree_fake_icon,
						data: { svgIcon: _Icons.getSvgIcon('folder-open-icon', 16, 24) },
						children: [],
						state: {
							opened: true,
						}
					};
					listRoot.push(newFolder);
					listRoot = newFolder.children;
				}

			}

			return listRoot;

		};


		let displayFunctionPackage = function(result) {

			for (const d of result) {
				createFolder(d.effectiveName.split('.'), list);
			}

			$(flowsTree).jstree(true).sort(list, true);

			callback(list);
		};

		let displayFunction = function(result) {

			for (const d of result) {

				const nameComponents = d.effectiveName.split('.');

				if (nameComponents.length > 1) {
					// Multi-component names must be abstracted through folders/packages
					let folders = nameComponents;
					// Pop the method name from the end of the folder list
					folders.pop();

					let folder = createFolder(folders, list);
					folder.push(createFlowEntry(d));

				} else {
					list.push(createFlowEntry(d));
				}
			}

			$(flowsTree).jstree(true).sort(list, true);

			callback(list);
		};

		if (!id) {

			Command.list('FlowContainer', false, methodPageSize, methodPage, 'name', 'asc', 'id,type,name,flowNodes,effectiveName', displayFunction);
			Command.list('FlowContainerPackage', false, methodPageSize, methodPage, 'name', 'asc', 'id,type,name,flowNodes,effectiveName,flows', displayFunctionPackage);

		} else {

			switch (id) {

				default:
					Command.query('FlowContainer', methodPageSize, methodPage, 'name', 'asc', {flowContainer: id}, displayFunction, true, 'ui');
					break;
			}
		}

	},
	openEditor: (detail) => {

		let flowNodeType = detail.nodeType;
		let element      = detail.element;
		let entity       = detail.entity; // proxy object
		let propertyName = detail.propertyName;

		Structr.dialog("Edit " + flowNodeType, () => {}, () => {}, ['popup-dialog-with-editor']);

		dialogText.append('<div class="editor h-full"></div>');
		dialogBtn.append(`
			<button id="editorSave" disabled="disabled" class="disabled">Save</button>
			<button id="saveAndClose" disabled="disabled" class="disabled"> Save and close</button>
		`);

		let dialogSaveButton = dialogBtn[0].querySelector('#editorSave');
		let saveAndClose     = dialogBtn[0].querySelector('#saveAndClose');

		let initialText = entity[propertyName] || '';

		let editorConfig = {
			value: initialText,
			language: 'auto',
			lint: true,
			autocomplete: true,
			forceAllowAutoComplete: true,
			isAutoscriptEnv: true,
			changeFn: (editor, entity) => {

				let editorText = editor.getValue();

				if (initialText === editorText) {
					dialogSaveButton.disabled = true;
					dialogSaveButton.classList.add('disabled');
					saveAndClose.disabled = true;
					saveAndClose.classList.add('disabled');
				} else {
					dialogSaveButton.disabled = null;
					dialogSaveButton.classList.remove('disabled');
					saveAndClose.disabled = null;
					saveAndClose.classList.remove('disabled');
				}
			},
			saveFn: (editor, entity) => {

				element.value = editor.getValue();
				element.dispatchEvent(new Event('change'));

				dialogSaveButton.disabled = true;
				dialogSaveButton.classList.add('disabled');
				saveAndClose.disabled = true;
				saveAndClose.classList.add('disabled');
			}
		};

		let editor = _Editors.getMonacoEditor(entity, propertyName, dialogText[0].querySelector('.editor'), editorConfig);

		Structr.resize();

		saveAndClose.addEventListener('click', (e) => {
			e.stopPropagation();

			editorConfig.saveFn(editor, entity);

			setTimeout(function() {
				dialogSaveButton.remove();
				saveAndClose.remove();
				dialogCancelButton.click();
			}, 500);
		});

		dialogSaveButton.addEventListener('click', (e) => {
			e.stopPropagation();

			editorConfig.saveFn(editor, entity);
		});

		dialogCancelButton.on('click', function(e) {
			dialogSaveButton.remove();
			saveAndClose.remove();
			return false;
		});

		editor.focus();

		window.setTimeout(() => {
			_Editors.resizeVisibleEditors();

			$('.closeButton', dialogBtn).blur();
			editor.focus();
		}, 10);
	},

	initFlow: (id) => {

		if (flowEditor !== undefined && flowEditor !== null && flowEditor.cleanup !== undefined) {
			flowEditor.cleanup();
			flowEditor = undefined;
		}

		// display flow canvas
		flowsCanvas.innerHTML = '<div id="nodeEditor" class="node-editor"></div>';
		nodeEditor = document.querySelector('#nodeEditor');

		flowId = id;
		let rest = new Rest();
		let persistence = new Persistence();

		persistence.getNodesById(id, new FlowContainer()).then( r => {
			document.title = "Flow - " + r[0].name;

			let rootElement = document.querySelector("#nodeEditor");
			flowEditor = new FlowEditor(rootElement, r[0], {deactivateInternalEvents: true});

			flowEditor.waitForInitialization().then( () => {

				rest.post(Structr.rootUrl + 'FlowContainer/' + r[0].id + "/getFlowNodes").then((res) => {

					let result = res.result;

					if (Array.isArray(result)) {
						for (let node of result) {

							flowEditor.renderNode(persistence._wrapObject(node, node), true);
						}
					} else {

						flowEditor.renderNode(persistence._wrapObject(result, result), true);
					}

					flowEditor._editor.view.update();

				}).then(() => {

					rest.post(Structr.rootUrl  + 'FlowContainer/' + r[0].id + "/getFlowRelationships").then((res) => {

						let result = res.result;

						if (result !== null && result !== undefined && result.length > 0) {

							for (let rel of result) {

								flowEditor.connectNodes(rel);
							}
						}

					}).then(() => {

						flowEditor.applySavedLayout();
						flowEditor._editor.view.update();
						flowEditor.resetView();

						flowEditor.setupContextMenu();

						flowEditor.disableRelationshipEvents = false;

						// activate buttons
						document.querySelector('.run_flow_icon').classList.remove('disabled');
						document.querySelector('.run_flow_icon').disabled = false;
						document.querySelector('.delete_flow_icon').classList.remove('disabled');
						document.querySelector('.delete_flow_icon').disabled = false;
						document.querySelector('.layout_icon').classList.remove('disabled');
						document.querySelector('.layout_icon').disabled = false;
					});
				});
			});
		});
	},

	templates: {
		main: config => `
			<div class="tree-main" id="flows-main">
				<div class="column-resizer"></div>
			
				<div class="tree-container" id="flows-tree-container">
					<div class="tree" id="flows-tree"></div>
				</div>
			
				<div class="tree-contents-container" id="flows-canvas-container">
					<div class="tree-contents tree-contents-with-top-buttons" id="flows-canvas"></div>
				</div>
			</div>
		`,
		functions: config => `
			<link rel="stylesheet" type="text/css" media="screen" href="css/flow-editor.css">
			
			<div class="inline-flex">

				<input class="mr-2" id="name-input" type="text" placeholder="Enter flow name" autocomplete="off">
				
				<button id="create-new-flow" class="action inline-flex items-center">
					${_Icons.getSvgIcon('circle_plus', 16, 16, ['mr-2'])} Add
				</button>
			</div>
			
			<button class="delete_flow_icon button flex items-center hover:bg-gray-100 focus:border-gray-666 active:border-green disabled" disabled>
				${_Icons.getSvgIcon('trashcan', 16, 16, _Icons.getSvgIconClassesForColoredIcon(['mr-2', 'icon-red']))} Delete flow
			</button>
			
			<label class="mr-4">
				Highlight:
				<select id="flow-focus-select" class="hover:bg-gray-100 focus:border-gray-666 active:border-green">
					<option value="none">-</option>
					<option value="action">Execution Flow</option>
					<option value="data">Data Flow</option>
					<option value="logic">Logic Flow</option>
					<option value="exception">Exception Handling</option>
				</select>
			</label>
			
			<button class="run_flow_icon button flex items-center hover:bg-gray-100 focus:border-gray-666 active:border-green disabled" disabled>
				${_Icons.getSvgIcon('run_button', 16, 16, _Icons.getSvgIconClassesNonColorIcon(['mr-2']))} Run
			</button>
			
			<button class="reset_view_icon button flex items-center hover:bg-gray-100 focus:border-gray-666 active:border-green">
				${_Icons.getSvgIcon('reset-arrow', 16, 16, 'mr-2')} Reset view
			</button>
			
			<button class="layout_icon button flex items-center hover:bg-gray-100 focus:border-gray-666 active:border-green disabled" disabled>
				${_Icons.getSvgIcon('magic_wand', 16, 16, 'mr-2')} Layout
			</button>
		`,
	}
};