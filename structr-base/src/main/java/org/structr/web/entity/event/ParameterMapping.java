/*
 * Copyright (C) 2010-2024 Structr GmbH
 *
 * This file is part of Structr <http://structr.org>.
 *
 * Structr is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Structr is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Structr.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.structr.web.entity.event;

import org.structr.common.error.FrameworkException;
import org.structr.core.graph.NodeInterface;
import org.structr.web.entity.dom.DOMElement;
import org.structr.web.entity.dom.DOMNode;

import java.util.Map;

public interface ParameterMapping extends NodeInterface {

	DOMElement getInputElement();

	String getParameterType();
	String getParameterName();
	String getConstantValue();
	String getScriptExpression();
	String getMethodResult();
	String getFlowResult();

	NodeInterface cloneParameterMapping(final Map<String, DOMNode> mapOfClonedNodes) throws FrameworkException;
}
