/*
 * Copyright (C) 2010-2024 Structr GmbH
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
package org.structr.flow.impl;

import org.structr.flow.api.DataSource;
import org.structr.flow.api.Exception;
import org.structr.module.api.DeployableEntity;

public interface FlowExceptionHandler extends FlowNode, Exception, DataSource, DeployableEntity {

	Iterable<FlowBaseNode> getHandledNodes();

	/*

	private static final Logger logger = LoggerFactory.getLogger(FlowExceptionHandler.class);

	public static final Property<Iterable<FlowBaseNode>> handledNodes = new StartNodes<>("handledNodes", FlowExceptionHandlerNodes.class);
	public static final Property<Iterable<FlowBaseNode>> dataTarget   = new EndNodes<>("dataTarget", FlowDataInput.class);

	public static final View defaultView = new View(FlowNode.class, PropertyView.Public,  next, handledNodes, dataTarget);
	public static final View uiView      = new View(FlowNode.class, PropertyView.Ui,      next, handledNodes, dataTarget);

	@Override
	public Object get(Context context) throws FlowException {

		return context.getData(getUuid());
	}

	@Override
	public FlowType getFlowType() {
		return FlowType.Exception;
	}

	@Override
	public FlowContainer getFlowContainer() {
		return this.getProperty(flowContainer);
	}

	@Override
	public FlowElement next() {
		return getProperty(FlowExceptionHandler.next);
	}

	@Override
	public Map<String, Object> exportData() {
		Map<String, Object> result = new HashMap<>();

		result.put("id", this.getUuid());
		result.put("type", this.getClass().getSimpleName());
		result.put("visibleToPublicUsers", this.getProperty(visibleToPublicUsers));
		result.put("visibleToAuthenticatedUsers", this.getProperty(visibleToAuthenticatedUsers));

		return result;
	}
	*/
}
