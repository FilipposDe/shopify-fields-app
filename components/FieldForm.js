import React, { useState } from 'react'
import { fieldTypes } from '../lib/constants'
import {
    Button,
    Card,
    Checkbox,
    ChoiceList,
    Form,
    FormLayout,
    Heading,
    Layout,
    Page,
    TextField,
} from '@shopify/polaris'

function FieldForm(props) {
    const [formData, setFormData] = useState(props.initialData)

    return (
        <Form onSubmit={() => props.onSubmit(formData)}>
            <FormLayout>
                <TextField
                    value={formData.name}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                    label="Field name"
                    type="text"
                    min={3}
                    max={30}
                />
                <TextField
                    value={formData.description}
                    onChange={(v) =>
                        setFormData({ ...formData, description: v })
                    }
                    label="Description"
                    type="text"
                    max={300}
                />
                <ChoiceList
                    title="Type"
                    choices={[
                        { label: 'Text', value: fieldTypes.TEXT },
                        { label: 'Number', value: fieldTypes.NUMBER },
                    ]}
                    selected={formData.type}
                    onChange={(v) => setFormData({ ...formData, type: v })}
                />
                <Button submit primary>
                    Save
                </Button>
            </FormLayout>
        </Form>
    )
}

export default FieldForm
