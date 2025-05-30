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
package org.structr.bolt;

import org.apache.commons.lang3.StringUtils;
import org.structr.api.search.QueryContext;
import org.structr.api.util.Iterables;

/**
 *
 */
public class FulltextNodeIndexQuery extends AdvancedCypherQuery {

	private final String tenantIdentifier;
	private String key = null;
	private Object value = null;

	public FulltextNodeIndexQuery(final QueryContext queryContext, final AbstractCypherIndex<?> index, final int requestedPageSize, final int requestedPage) {

		super(queryContext, index, requestedPageSize, requestedPage);

		tenantIdentifier = index.getDatabaseService().getTenantIdentifier();
	}

	@Override
	public void addSimpleParameter(final String identifier, final String key, final String operator, final Object value, final boolean isProperty, final boolean caseInsensitive) {

		this.key   = key;
		this.value = value;
	}

	@Override
	public String getStatement() {

		//return "CALL db.index.fulltext.queryNodes(\"" + Iterables.first(typeLabels) + "_" + key + "\", \"" + value +"\") YIELD node RETURN node LIMIT 10";

		// CALL db.index.fulltext.queryNodes("File_extractedContent", "sit") YIELD node WHERE ANY(l in labels(node) WHERE l = "AZXHCAWZFX") RETURN node;

		if (StringUtils.isNotBlank(tenantIdentifier)) {

			return "CALL db.index.fulltext.queryNodes(\"" + Iterables.first(typeLabels) + "_" + key + "\", \"" + value + "\") YIELD node WHERE ANY (l in labels(node) WHERE l = \"" + tenantIdentifier + "\") RETURN node";

		} else {

			return "CALL db.index.fulltext.queryNodes(\"" + Iterables.first(typeLabels) + "_" + key + "\", \"" + value + "\") YIELD node RETURN node";
		}
	}

}